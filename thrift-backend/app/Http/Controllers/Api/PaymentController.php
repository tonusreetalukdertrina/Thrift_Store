<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Listing;
use App\Models\Notification;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class PaymentController extends Controller
{
    private function stripe(): StripeClient
    {
        $secret = config('services.stripe.secret');
        if (! $secret) {
            throw new \RuntimeException('Stripe secret key is not configured in .env');
        }
        return new StripeClient($secret);
    }

    public function createCheckoutSession(Request $request)
    {
        $request->validate([
            'listing_ids'   => ['required', 'array', 'min:1'],
            'listing_ids.*' => ['required', 'uuid', 'exists:listings,listing_id'],
        ]);

        $seller     = auth('api')->user();
        $listingFee = (int) config('services.stripe.listing_fee', 42);
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        $alreadyActive = Listing::whereIn('listing_id', $request->listing_ids)
            ->where('seller_id', $seller->user_id)
            ->where('status', 'active')
            ->pluck('listing_id')
            ->toArray();

        if (!empty($alreadyActive)) {
            return ApiResponse::error(
                'Some listings are already active. Cannot repay for: ' . count($alreadyActive) . ' listing(s).',
                422
            );
        }

        $listings = Listing::whereIn('listing_id', $request->listing_ids)
            ->where('seller_id', $seller->user_id)
            ->where('status', 'draft')
            ->get();

        if ($listings->isEmpty()) {
            return ApiResponse::error(
                'No draft listings found. Listings may already be active.',
                404
            );
        }

        $paidListings = [];
        foreach ($listings as $listing) {
            $hasPaidPayment = Payment::where('listing_id', $listing->listing_id)
                ->where('status', 'paid')
                ->exists();
            if ($hasPaidPayment) {
                $paidListings[] = $listing->listing_id;
            }
        }

        if (!empty($paidListings)) {
            return ApiResponse::error(
                'Some listings already have a paid payment. Cannot repay.',
                422
            );
        }

        $listingCount = $listings->count();
        $totalAmount  = $listingFee * $listingCount;

        $lineItems = $listings->map(function ($listing) use ($listingFee) {
            return [
                'price_data' => [
                    'currency'     => 'usd',
                    'unit_amount'  => $listingFee,
                    'product_data' => [
                        'name'        => 'Listing Fee: ' . $listing->title,
                        'description' => 'Fee to publish listing',
                    ],
                ],
                'quantity' => 1,
            ];
        })->toArray();

        $listingIdsString = $listings->pluck('listing_id')->join(',');

        try {
            $stripe  = $this->stripe();
            $session = $stripe->checkout->sessions->create([
                'payment_method_types' => ['card'],
                'line_items'           => $lineItems,
                'mode'                 => 'payment',
                'success_url'          => $frontendUrl . '/listings/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url'           => $frontendUrl . '/dashboard/seller?cancelled=true',
                'metadata'             => [
                    'listing_ids' => $listingIdsString,
                    'seller_id'   => $seller->user_id,
                    'item_count'  => (string) $listingCount,
                ],
                'payment_intent_data'  => [
                    'metadata' => [
                        'listing_ids' => $listingIdsString,
                        'seller_id'   => $seller->user_id,
                    ],
                ],
            ]);

            \Log::info("Stripe session created: {$session->id}");
        } catch (ApiErrorException $e) {
            return ApiResponse::error('Stripe error: ' . $e->getMessage(), 502);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 500);
        }

        foreach ($listings as $listing) {
            Payment::create([
                'payment_id'      => Str::uuid(),
                'seller_id'       => $seller->user_id,
                'listing_id'      => $listing->listing_id,
                'amount'          => $listingFee / 100,
                'currency'        => 'USD',
                'method'          => 'card',
                'status'          => 'pending',
                'transaction_ref' => $session->id,
            ]);
        }

        return ApiResponse::success([
            'checkout_url'   => $session->url,
            'session_id'     => $session->id,
            'listings_count' => $listingCount,
            'total_amount'   => $totalAmount / 100,
        ], "Redirecting to pay for {$listingCount} listing(s)");
    }

    public function handleWebhook(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        if (! $secret) {
            \Log::error('Stripe webhook secret not configured');
            return response()->json(['error' => 'Webhook not configured'], 500);
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            \Log::error('Stripe webhook signature failed: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\Exception $e) {
            \Log::error('Stripe webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook error'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session   = $event->data->object;
            $sessionId = $session->id;
            $sellerId  = $session->metadata->seller_id ?? null;

            $pendingPayments = Payment::where('transaction_ref', $sessionId)
                ->where('status', 'pending')
                ->get();

            if ($pendingPayments->isEmpty()) {
                \Log::warning("No pending payments found for session: {$sessionId}");
                return response()->json(['received' => true], 200);
            }

            $activatedCount = 0;

            foreach ($pendingPayments as $payment) {
                $listing = Listing::where('listing_id', $payment->listing_id)->first();

                if ($listing) {
                    $listing->update(['status' => 'active']);
                    $activatedCount++;
                }

                $payment->update([
                    'status'           => 'paid',
                    'gateway_response' => json_encode((array) $session),
                    'paid_at'          => now(),
                ]);
            }

            if ($sellerId && $activatedCount > 0) {
                Notification::create([
                    'notification_id' => Str::uuid(),
                    'user_id'         => $sellerId,
                    'type'            => 'listing_published',
                    'body'            => "{$activatedCount} listing(s) published successfully after payment.",
                    'status'          => 'unread',
                ]);
            }
        }

        if ($event->type === 'checkout.session.expired') {
            $session = $event->data->object;
            Payment::where('transaction_ref', $session->id)
                ->update(['status' => 'failed']);
        }

        return response()->json(['received' => true], 200);
    }

    public function index()
    {
        $seller = auth('api')->user();

        $payments = Payment::with('listing:listing_id,title')
            ->where('seller_id', $seller->user_id)
            ->orderBy('created_at', 'desc')
            ->get();

        $grouped = $payments->groupBy('transaction_ref')->map(function ($group) {
            $first  = $group->first();
            $status = $group->every(fn($p) => $p->status === 'paid')
                ? 'paid'
                : ($group->every(fn($p) => $p->status === 'failed')
                    ? 'failed'
                    : 'partial');

            return [
                'transaction_ref' => $first->transaction_ref,
                'paid_at'         => $first->paid_at,
                'created_at'      => $first->created_at,
                'currency'        => $first->currency,
                'total_amount'    => $group->sum('amount'),
                'item_count'      => $group->count(),
                'status'          => $status,
                'method'          => $first->method,
                'listings'        => $group->map(fn($p) => [
                    'payment_id' => $p->payment_id,
                    'listing_id' => $p->listing_id,
                    'title'      => $p->listing?->title ?? 'Deleted listing',
                    'amount'     => $p->amount,
                    'status'     => $p->status,
                ]),
            ];
        })->values();

        return ApiResponse::success($grouped);
    }

    public function due()
    {
        $seller     = auth('api')->user();
        $listingFee = config('services.stripe.listing_fee', 42) / 100;

        $draftCount  = Listing::where('seller_id', $seller->user_id)
            ->where('status', 'draft')
            ->count();

        $draftListings = Listing::where('seller_id', $seller->user_id)
            ->where('status', 'draft')
            ->get(['listing_id', 'title', 'created_at']);

        return ApiResponse::success([
            'draft_count'     => $draftCount,
            'fee_per_listing' => $listingFee,
            'total_due'       => $draftCount * $listingFee,
            'draft_listings'  => $draftListings,
        ]);
    }

    public function verifyAndActivate(Request $request)
    {
        $request->validate([
            'session_id' => ['required', 'string'],
        ]);

        $seller    = auth('api')->user();
        $sessionId = $request->session_id;

        try {
            $stripe  = $this->stripe();
            $session = $stripe->checkout->sessions->retrieve($sessionId, [
                'expand' => ['line_items'],
            ]);

            if ($session->payment_status !== 'paid') {
                return ApiResponse::error('Payment not completed yet', 402);
            }

            $listingIdsString = $session->metadata->listing_ids ?? null;
            $sellerId         = $session->metadata->seller_id ?? null;

            if (! $listingIdsString || ! $sellerId) {
                return ApiResponse::error('Session metadata missing', 400);
            }

            if ($sellerId !== $seller->user_id) {
                return ApiResponse::error('Unauthorized', 403);
            }

            $listingIds = array_filter(
                array_map('trim', explode(',', $listingIdsString))
            );

            $activated = Listing::whereIn('listing_id', $listingIds)
                ->where('seller_id', $sellerId)
                ->whereIn('status', ['draft', 'pending'])
                ->update(['status' => 'active']);

            Payment::where('transaction_ref', $sessionId)
                ->update([
                    'status'  => 'paid',
                    'paid_at' => now(),
                ]);

            if ($activated > 0) {
                Notification::create([
                    'notification_id' => Str::uuid(),
                    'user_id'         => $sellerId,
                    'type'            => 'listing_published',
                    'body'            => "{$activated} listing(s) are now live on the marketplace!",
                    'status'          => 'unread',
                ]);
            }

            return ApiResponse::success([
                'activated'   => $activated,
                'session_id'  => $sessionId,
                'listing_ids' => $listingIds,
            ], "{$activated} listing(s) activated successfully");

        } catch (\Stripe\Exception\ApiErrorException $e) {
            \Log::error('Stripe verify error: ' . $e->getMessage());
            return ApiResponse::error('Could not verify payment: ' . $e->getMessage(), 502);
        }
    }
}
