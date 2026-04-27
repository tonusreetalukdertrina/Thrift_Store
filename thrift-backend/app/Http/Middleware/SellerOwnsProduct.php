<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use App\Models\Product;
use Closure;
use Illuminate\Http\Request;

class SellerOwnsProduct
{
    public function handle(Request $request, Closure $next)
    {
        $user      = auth('api')->user();
        $productId = $request->route('id') ?? $request->route('product_id');

        if ($productId) {
            $product = Product::where('product_id', $productId)->first();

            if ($product && $product->seller_id !== $user->user_id && $user->role !== 'admin') {
                return ApiResponse::error('You do not own this listing', 403);
            }
        }

        return $next($request);
    }
}