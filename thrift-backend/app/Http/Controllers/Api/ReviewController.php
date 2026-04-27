<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Listing;
use App\Models\Notification;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'listing_id' => ['required', 'uuid', 'exists:listings,listing_id'],
            'rating'     => ['required', 'integer', 'min:1', 'max:5'],
            'comment'    => ['nullable', 'string', 'max:2000'],
        ]);

        $buyer = auth('api')->user();

        $listing = Listing::where('listing_id', $request->listing_id)
            ->where('status', 'sold')
            ->first();

        if (! $listing) {
            return ApiResponse::error('You can only review a listing after it has been marked as sold', 403);
        }

        if ($listing->interested_buyer_id !== $buyer->user_id) {
            return ApiResponse::error('You can only review listings you were interested in', 403);
        }

        $existing = Review::where('listing_id', $request->listing_id)
            ->where('buyer_id', $buyer->user_id)
            ->first();

        if ($existing) {
            return ApiResponse::error('You have already reviewed this listing', 422);
        }

        $review = Review::create([
            'review_id' => Str::uuid(),
            'listing_id'=> $listing->listing_id,
            'buyer_id'  => $buyer->user_id,
            'seller_id' => $listing->seller_id,
            'rating'    => $request->rating,
            'comment'   => $request->comment,
            'is_removed'=> false,
        ]);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $listing->seller_id,
            'type'            => 'new_review',
            'body'            => "{$buyer->name} left you a {$request->rating}-star review.",
            'status'          => 'unread',
        ]);

        $review->load('buyer:user_id,name,profile_photo_url');

        return ApiResponse::created([
            'review'            => $review,
            'seller_avg_rating' => $this->getAvgRating($listing->seller_id),
        ], 'Review submitted successfully');
    }

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

    public function sellerProfile(string $sellerId)
    {
        $seller = \App\Models\User::where('user_id', $sellerId)
            ->where('is_blocked', false)
            ->first();

        if (! $seller) {
            return ApiResponse::error('Seller not found', 404);
        }

        $activeListings = Listing::where('seller_id', $sellerId)
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
