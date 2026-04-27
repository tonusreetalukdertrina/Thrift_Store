<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReviewController extends Controller
{
    // POST /api/v1/reviews — buyer submits a review
    public function store(StoreReviewRequest $request)
    {
        $buyer = auth('api')->user();

        // Find the order — must belong to this buyer and be completed
        $order = Order::with('product')
            ->where('order_id', $request->order_id)
            ->where('buyer_id', $buyer->user_id)
            ->where('status', 'completed')
            ->first();

        if (! $order) {
            return ApiResponse::error(
                'You can only review a seller after your order is completed',
                403
            );
        }

        // One review per order
        $existing = Review::where('order_id', $request->order_id)->first();
        if ($existing) {
            return ApiResponse::error('You have already reviewed this order', 422);
        }

        $review = Review::create([
            'review_id' => Str::uuid(),
            'order_id'  => $order->order_id,
            'buyer_id'  => $buyer->user_id,
            'seller_id' => $order->product->seller_id,
            'rating'    => $request->rating,
            'comment'   => $request->comment,
            'is_removed'=> false,
        ]);

        // Notify seller
        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $order->product->seller_id,
            'type'            => 'new_review',
            'body'            => "{$buyer->name} left you a {$request->rating}-star review.",
            'status'          => 'unread',
        ]);

        $review->load('buyer:user_id,name,profile_photo_url');

        return ApiResponse::created([
            'review'         => $review,
            'seller_avg_rating' => $this->getAvgRating($order->product->seller_id),
        ], 'Review submitted successfully');
    }

    // POST /api/v1/reviews/{id}/respond — seller responds to a review
    public function respond(Request $request, string $id)
    {
        $seller = auth('api')->user();

        $request->validate([
            'response' => ['required', 'string', 'max:1000'],
        ]);

        $review = Review::where('review_id', $id)
            ->where('seller_id', $seller->user_id)
            ->where('is_removed', false)
            ->first();

        if (! $review) {
            return ApiResponse::error('Review not found', 404);
        }

        if ($review->seller_response) {
            return ApiResponse::error('You have already responded to this review', 422);
        }

        $review->update([
            'seller_response'     => $request->response,
            'seller_responded_at' => now(),
        ]);

        return ApiResponse::success($review, 'Response added');
    }

    // GET /api/v1/sellers/{id}/reviews — public, get all reviews for a seller
    public function sellerReviews(string $sellerId)
    {
        $reviews = Review::with('buyer:user_id,name,profile_photo_url')
            ->where('seller_id', $sellerId)
            ->where('is_removed', false)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $avgRating = $this->getAvgRating($sellerId);

        return ApiResponse::success([
            'reviews'    => $reviews,
            'avg_rating' => $avgRating,
        ]);
    }

    // GET /api/v1/sellers/{id} — public seller profile
    public function sellerProfile(string $sellerId)
    {
        $seller = \App\Models\User::where('user_id', $sellerId)
            ->where('is_blocked', false)
            ->first();

        if (! $seller) {
            return ApiResponse::error('Seller not found', 404);
        }

        $activeListings = \App\Models\Product::where('seller_id', $sellerId)
            ->where('status', 'active')
            ->get();

        $avgRating   = $this->getAvgRating($sellerId);
        $reviewCount = Review::where('seller_id', $sellerId)
            ->where('is_removed', false)
            ->count();

        return ApiResponse::success([
            'seller' => [
                'user_id'           => $seller->user_id,
                'name'              => $seller->name,
                'profile_photo_url' => $seller->profile_photo_url,
                'member_since'      => $seller->created_at,
            ],
            'avg_rating'      => $avgRating,
            'review_count'    => $reviewCount,
            'active_listings' => $activeListings,
        ]);
    }

    private function getAvgRating(string $sellerId): float|null
    {
        $avg = Review::where('seller_id', $sellerId)
            ->where('is_removed', false)
            ->avg('rating');

        return $avg ? round($avg, 1) : null;
    }
}