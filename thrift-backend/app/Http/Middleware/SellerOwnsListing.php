<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use App\Models\Listing;
use Closure;
use Illuminate\Http\Request;

class SellerOwnsListing
{
    public function handle(Request $request, Closure $next)
    {
        $user      = auth('api')->user();
        $listingId = $request->route('id') ?? $request->route('listing_id');

        if ($listingId) {
            $listing = Listing::where('listing_id', $listingId)->first();

            if ($listing && $listing->seller_id !== $user->user_id && $user->role !== 'admin') {
                return ApiResponse::error('You do not own this listing', 403);
            }
        }

        return $next($request);
    }
}
