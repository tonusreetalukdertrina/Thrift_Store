<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // POST /api/v1/orders — buyer expresses interest
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,product_id'],
            'buyer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $buyer   = auth('api')->user();
        $product = Product::with('seller:user_id,name,phone,email')
            ->where('product_id', $request->product_id)
            ->where('status', 'active')
            ->first();

        if (! $product) {
            return ApiResponse::error('This listing is no longer available', 422);
        }

        if ($product->seller_id === $buyer->user_id) {
            return ApiResponse::error('You cannot express interest in your own listing', 422);
        }

        // Check if buyer already has a pending/confirmed interest
        $existing = Order::where('product_id', $request->product_id)
            ->where('buyer_id', $buyer->user_id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if ($existing) {
            return ApiResponse::error('You have already expressed interest in this listing', 422);
        }

        $order = Order::create([
            'order_id'   => Str::uuid(),
            'buyer_id'   => $buyer->user_id,
            'product_id' => $request->product_id,
            'status'     => 'pending',
            'buyer_note' => $request->buyer_note,
        ]);

        OrderStatusHistory::create([
            'order_id'   => $order->order_id,
            'changed_by' => $buyer->user_id,
            'old_status' => 'none',
            'new_status' => 'pending',
            'note'       => 'Buyer expressed interest',
            'changed_at' => now(),
        ]);

        // Notify seller WITH buyer contact details
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $product->seller_id,
            'type'            => 'new_interest',
            'body'            => "{$buyer->name} is interested in \"{$product->title}\". "
                               . "Contact: {$buyer->phone}",
            'status'          => 'unread',
        ]);

        // Give buyer seller's contact details
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $buyer->user_id,
            'type'            => 'interest_sent',
            'body'            => "Your interest in \"{$product->title}\" has been sent to the seller. "
                               . "Seller contact: {$product->seller->name} — {$product->seller->phone}",
            'status'          => 'unread',
        ]);

        return ApiResponse::created([
            'order'          => $order,
            'seller_contact' => [
                'name'  => $product->seller->name,
                'phone' => $product->seller->phone,
            ],
        ], 'Interest expressed successfully');
    }

    // PATCH /api/v1/orders/{id}/confirm — seller confirms the deal
    public function confirm(string $id)
    {
        $seller = auth('api')->user();
        $order  = Order::with('product', 'buyer:user_id,name,phone')
            ->where('order_id', $id)
            ->where('status', 'pending')
            ->first();

        if (! $order) {
            return ApiResponse::error('Order not found or already processed', 404);
        }

        if ($order->product->seller_id !== $seller->user_id) {
            return ApiResponse::error('You are not the seller for this order', 403);
        }

        // Confirm order
        $order->update(['status' => 'confirmed']);

        // Mark product as sold so no one else can express interest
        $order->product->update(['status' => 'sold']);

        OrderStatusHistory::create([
            'order_id'   => $order->order_id,
            'changed_by' => $seller->user_id,
            'old_status' => 'pending',
            'new_status' => 'confirmed',
            'note'       => 'Seller confirmed the deal',
            'changed_at' => now(),
        ]);

        // Notify buyer
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $order->buyer_id,
            'type'            => 'order_confirmed',
            'body'            => "The seller confirmed your interest in \"{$order->product->title}\". "
                               . "The item is now reserved for you. "
                               . "Arrange pickup/delivery directly with the seller.",
            'status'          => 'unread',
        ]);

        return ApiResponse::success([
            'order'          => $order,
            'buyer_contact'  => [
                'name'  => $order->buyer->name,
                'phone' => $order->buyer->phone,
            ],
        ], 'Deal confirmed. Product marked as sold.');
    }

    // PATCH /api/v1/orders/{id}/cancel — buyer cancels interest
    public function cancel(Request $request, string $id)
    {
        $buyer = auth('api')->user();
        $order = Order::with('product')
            ->where('order_id', $id)
            ->where('buyer_id', $buyer->user_id)
            ->first();

        if (! $order) {
            return ApiResponse::error('Order not found', 404);
        }

        if (! in_array($order->status, ['pending', 'confirmed'])) {
            return ApiResponse::error('This order cannot be cancelled', 422);
        }

        $oldStatus = $order->status;

        $order->update([
            'status'        => 'cancelled',
            'cancelled_at'  => now(),
            'cancel_reason' => $request->input('cancel_reason', 'Cancelled by buyer'),
        ]);

        // If seller had confirmed, re-activate the product
        if ($oldStatus === 'confirmed') {
            $order->product->update(['status' => 'active']);
        }

        OrderStatusHistory::create([
            'order_id'   => $order->order_id,
            'changed_by' => $buyer->user_id,
            'old_status' => $oldStatus,
            'new_status' => 'cancelled',
            'note'       => $request->input('cancel_reason', 'Cancelled by buyer'),
            'changed_at' => now(),
        ]);

        // Notify seller
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $order->product->seller_id,
            'type'            => 'order_cancelled',
            'body'            => "{$buyer->name} cancelled their interest in \"{$order->product->title}\"."
                               . ($oldStatus === 'confirmed' ? ' The listing is now active again.' : ''),
            'status'          => 'unread',
        ]);

        return ApiResponse::success(null, 'Interest cancelled successfully');
    }

    // PATCH /api/v1/orders/{id}/complete — seller marks deal as done
    public function complete(string $id)
    {
        $seller = auth('api')->user();
        $order  = Order::with('product', 'buyer:user_id,name')
            ->where('order_id', $id)
            ->where('status', 'confirmed')
            ->first();

        if (! $order) {
            return ApiResponse::error('Order not found or not confirmed', 404);
        }

        if ($order->product->seller_id !== $seller->user_id) {
            return ApiResponse::error('You are not the seller for this order', 403);
        }

        $order->update(['status' => 'completed']);

        OrderStatusHistory::create([
            'order_id'   => $order->order_id,
            'changed_by' => $seller->user_id,
            'old_status' => 'confirmed',
            'new_status' => 'completed',
            'note'       => 'Transaction completed',
            'changed_at' => now(),
        ]);

        // Notify buyer — prompt review
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $order->buyer_id,
            'type'            => 'order_completed',
            'body'            => "Your purchase of \"{$order->product->title}\" is complete! Leave a review for the seller.",
            'status'          => 'unread',
        ]);

        return ApiResponse::success(null, 'Order marked as completed');
    }

    // GET /api/v1/orders — buyer sees their interests
    public function buyerOrders()
    {
        $buyer  = auth('api')->user();
        $orders = Order::with([
            'product:product_id,title,price,images,seller_id',
            'statusHistory',
            'review:review_id,order_id,rating,comment',
        ])
            ->where('buyer_id', $buyer->user_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return ApiResponse::success($orders);
    }

    // GET /api/v1/seller/orders — seller sees interests in their products
    public function sellerOrders()
    {
        $seller = auth('api')->user();
        $orders = Order::with([
            'product:product_id,title,price,images',
            'buyer:user_id,name,phone',
            'statusHistory',
        ])
            ->whereHas('product', fn($q) => $q->where('seller_id', $seller->user_id))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return ApiResponse::success($orders);
    }

    // GET /api/v1/orders/{id}
    public function show(string $id)
    {
        $user  = auth('api')->user();
        $order = Order::with([
            'product:product_id,title,price,images,seller_id,location',
            'buyer:user_id,name,phone',
            'statusHistory',
            'review',
        ])->where('order_id', $id)->first();

        if (! $order) {
            return ApiResponse::error('Order not found', 404);
        }

        $isBuyer  = $order->buyer_id === $user->user_id;
        $isSeller = $order->product->seller_id === $user->user_id;

        if (! $isBuyer && ! $isSeller && $user->role !== 'admin') {
            return ApiResponse::error('Forbidden', 403);
        }

        return ApiResponse::success($order);
    }

    // GET /api/v1/seller/stats
    public function sellerStats()
    {
        $seller = auth('api')->user();

        $completedOrders = Order::with('product:product_id,price,title')
            ->whereHas('product', fn($q) => $q->where('seller_id', $seller->user_id))
            ->where('status', 'completed')
            ->get();

        $revenue    = $completedOrders->sum(fn($o) => (float) $o->product?->price);
        $listingFees = \App\Models\Payment::where('seller_id', $seller->user_id)
            ->where('status', 'paid')
            ->sum('amount');

        return ApiResponse::success([
            'completed_orders'  => $completedOrders->count(),
            'gross_revenue'     => round($revenue, 2),
            'listing_fees_paid' => round((float) $listingFees, 2),
            'net_profit'        => round($revenue - (float) $listingFees, 2),
        ]);
    }

    private function notify(string $userId, string $type, string $body): void
    {
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $userId,
            'type'            => $type,
            'body'            => $body,
            'status'          => 'unread',
        ]);
    }
}