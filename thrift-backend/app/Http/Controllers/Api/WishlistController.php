<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    // GET /api/v1/wishlist
    public function index()
    {
        $items = Wishlist::with('product:product_id,title,price,images,status,condition')
            ->where('user_id', auth('api')->user()->user_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return ApiResponse::success($items);
    }

    // POST /api/v1/wishlist
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,product_id'],
        ]);

        $userId = auth('api')->user()->user_id;

        $exists = Wishlist::where('user_id', $userId)
            ->where('product_id', $request->product_id)
            ->exists();

        if ($exists) {
            return ApiResponse::error('Already in your wishlist', 422);
        }

        Wishlist::create([
            'user_id'    => $userId,
            'product_id' => $request->product_id,
            'created_at' => now(),
        ]);

        return ApiResponse::created(null, 'Added to wishlist');
    }

    // DELETE /api/v1/wishlist/{product_id}
    public function destroy(string $productId)
    {
        $deleted = Wishlist::where('user_id', auth('api')->user()->user_id)
            ->where('product_id', $productId)
            ->delete();

        if (! $deleted) {
            return ApiResponse::error('Item not found in wishlist', 404);
        }

        return ApiResponse::success(null, 'Removed from wishlist');
    }
}