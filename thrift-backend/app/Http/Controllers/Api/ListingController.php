<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Listing;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        $query = Listing::with([
            'seller:user_id,name',
            'category:category_id,category_name',
        ]);

        if ($request->filled('interested_buyer_id')) {
            $query->where('interested_buyer_id', $request->interested_buyer_id);
        } else {
            $query->where('status', 'active');
        }

        if ($request->filled('q') && strlen(trim($request->q)) > 0) {
            $search = trim($request->q);
            $query->where(function ($q) use ($search) {
                $q->whereRaw(
                    "to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery(?)",
                    [$search]
                )->orWhere('title', 'ilike', '%' . $search . '%');
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->category_id);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('location')) {
            $query->where('location', 'ilike', '%' . $request->location . '%');
        }

        switch ($request->get('sort', 'newest')) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            default:
                $query->orderBy('created_at', 'desc');
        }

        $listings = $query->paginate(20);

        $listings->getCollection()->transform(function ($listing) {
            $listing->seller_avg_rating = $this->getSellerAvgRating($listing->seller_id);
            return $listing;
        });

        return ApiResponse::success($listings);
    }

    public function show(string $id)
    {
        $listing = Listing::with([
            'seller:user_id,name,profile_photo_url',
            'category:category_id,category_name',
        ])->where('listing_id', $id)->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found', 404);
        }

        $user = auth('api')->user();
        if ($user && ($user->user_id === $listing->seller_id || $user->role === 'admin')) {
            $listing->load('interestedBuyer:user_id,name,phone');
        }

        if ($user && $listing->interested_buyer_id === $user->user_id) {
            $listing->load('seller:user_id,name,phone,profile_photo_url');
        }

        $listing->seller_avg_rating = $this->getSellerAvgRating($listing->seller_id);

        return ApiResponse::success($listing);
    }

    public function store(Request $request)
    {
        $seller = auth('api')->user();

        if ($seller->role === 'admin') {
            return ApiResponse::error('Administrators cannot create listings', 403);
        }

        $request->validate([
            'title'       => ['required', 'string', 'min:5', 'max:120'],
            'description' => ['required', 'string', 'min:20', 'max:2000'],
            'price'       => ['required', 'numeric', 'min:0.01'],
            'condition'   => ['required', 'in:New,Like New,Good,Fair'],
            'category_id' => ['required', 'integer', 'exists:categories,category_id'],
            'location'    => ['nullable', 'string', 'max:255'],
            'images'      => ['required', 'array', 'min:3', 'max:5'],
            'images.*'    => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ], [
            'images.min'   => 'You must upload at least 3 images.',
            'images.max'   => 'You can upload a maximum of 5 images.',
            'images.*.image' => 'Each file must be an image.',
            'images.*.mimes' => 'Images must be JPEG, PNG, or WebP.',
            'images.*.max'   => 'Each image must be under 5MB.',
        ]);

        $imagePaths = [];
        foreach ($request->file('images') as $image) {
            $path = $image->store('listings', 'public');
            $imagePaths[] = '/storage/' . $path;
        }

        $listing = Listing::create([
            'listing_id'   => Str::uuid(),
            'seller_id'    => $seller->user_id,
            'category_id'  => $request->category_id,
            'title'        => $request->title,
            'description'  => $request->description,
            'price'        => $request->price,
            'condition'    => $request->condition,
            'images'       => $imagePaths,
            'status'       => 'draft',
            'location'     => $request->location,
            'expires_at'   => now()->addDays(60),
        ]);

        return ApiResponse::created([
            'listing'     => $listing,
            'next_step'   => 'Pay listing fee to publish',
            'payment_url' => url('/api/v1/payments/checkout'),
        ], 'Listing created as draft. Complete payment to publish.');
    }

    public function update(Request $request, string $id)
    {
        $listing = Listing::where('listing_id', $id)
            ->where('seller_id', auth('api')->user()->user_id)
            ->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found or you do not own this listing', 404);
        }

        if (! in_array($listing->status, ['draft', 'active'])) {
            return ApiResponse::error('Only draft or active listings can be edited', 422);
        }

        $request->validate([
            'title'       => ['sometimes', 'string', 'min:5', 'max:120'],
            'description' => ['sometimes', 'string', 'min:20', 'max:2000'],
            'price'       => ['sometimes', 'numeric', 'min:0.01'],
            'condition'   => ['sometimes', 'in:New,Like New,Good,Fair'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,category_id'],
            'location'    => ['nullable', 'string', 'max:255'],
        ]);

        $listing->update($request->only(['title', 'description', 'price', 'condition', 'category_id', 'location']));

        return ApiResponse::success($listing, 'Listing updated');
    }

    public function destroy(string $id)
    {
        $listing = Listing::where('listing_id', $id)
            ->where('seller_id', auth('api')->user()->user_id)
            ->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found or you do not own this listing', 404);
        }

        $listing->update(['status' => 'archived']);

        return ApiResponse::success(null, 'Listing archived successfully');
    }

    public function updateStatus(Request $request, string $id)
    {
        $user = auth('api')->user();
        $listing = Listing::where('listing_id', $id)->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found', 404);
        }

        $request->validate([
            'status' => ['required', 'in:active,interested,sold,archived,draft'],
        ]);

        $newStatus = $request->status;
        $oldStatus = $listing->status;

        $allowed = $this->allowedTransition($oldStatus, $newStatus, $user, $listing);

        if (! $allowed) {
            return ApiResponse::error('This status transition is not allowed', 422);
        }

        if ($newStatus === 'interested') {
            $listing->interested_buyer_id = $user->user_id;
        }

        if ($newStatus === 'active' && $oldStatus === 'interested') {
            $listing->interested_buyer_id = null;
        }

        $listing->status = $newStatus;
        $listing->save();

        $this->notifyStatusChange($listing, $oldStatus, $newStatus, $user);

        if ($newStatus === 'interested') {
            $listing->load('seller:user_id,name,phone');
            return ApiResponse::success([
                'listing'        => $listing,
                'seller_contact' => [
                    'name'  => $listing->seller->name,
                    'phone' => $listing->seller->phone,
                ],
            ], 'Interest expressed successfully');
        }

        return ApiResponse::success($listing, "Listing marked as {$newStatus}");
    }

    private function allowedTransition(string $old, string $new, $user, $listing): bool
    {
        return match ($old) {
            'active' => match ($new) {
                'interested' => $listing->seller_id !== $user->user_id,
                'archived'   => $listing->seller_id === $user->user_id || $user->role === 'admin',
                default      => false,
            },
            'interested' => match ($new) {
                'sold'   => $listing->seller_id === $user->user_id,
                'active' => $listing->interested_buyer_id === $user->user_id,
                default  => false,
            },
            'draft' => match ($new) {
                'active'   => $listing->seller_id === $user->user_id,
                'archived' => $listing->seller_id === $user->user_id,
                default    => false,
            },
            'sold', 'archived' => false,
            default => false,
        };
    }

    private function notifyStatusChange($listing, string $old, string $new, $user): void
    {
        if ($new === 'interested') {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->seller_id,
                'type'            => 'interest_received',
                'body'            => "{$user->name} is interested in \"{$listing->title}\". Contact: {$user->phone}",
                'status'          => 'unread',
            ]);
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $user->user_id,
                'type'            => 'interest_sent',
                'body'            => "Your interest in \"{$listing->title}\" has been sent to the seller. Seller contact: {$listing->seller->name} — {$listing->seller->phone}",
                'status'          => 'unread',
            ]);
        }

        if ($new === 'sold') {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->interested_buyer_id,
                'type'            => 'listing_sold',
                'body'            => "The seller confirmed the sale for \"{$listing->title}\". Arrange pickup/delivery directly with the seller.",
                'status'          => 'unread',
            ]);
        }

        if ($new === 'active' && $old === 'interested') {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->seller_id,
                'type'            => 'interest_withdrawn',
                'body'            => "{$user->name} withdrew their interest in \"{$listing->title}\". The listing is now available again.",
                'status'          => 'unread',
            ]);
        }

        if ($new === 'archived' && $old === 'active') {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->seller_id,
                'type'            => 'listing_archived',
                'body'            => "Your listing \"{$listing->title}\" has been archived.",
                'status'          => 'unread',
            ]);
        }
    }

    public function myListings(Request $request)
    {
        $seller = auth('api')->user();

        $query = Listing::with(['category:category_id,category_name'])
            ->where('seller_id', $seller->user_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $listings = $query->orderBy('created_at', 'desc')->get();

        return ApiResponse::success($listings);
    }

    public function categories()
    {
        $categories = \App\Models\Category::where('is_active', true)->get();

        return ApiResponse::success($categories);
    }

    private function getSellerAvgRating(string $sellerId): float|null
    {
        $avg = \App\Models\Review::where('seller_id', $sellerId)
            ->where('is_removed', false)
            ->avg('rating');

        return $avg ? round($avg, 1) : null;
    }
}
