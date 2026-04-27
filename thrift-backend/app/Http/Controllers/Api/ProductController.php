<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with([
            'seller:user_id,name',
            'category:category_id,category_name',
            'subcategory:subcategory_id,subcategory_name',
        ])->where('status', 'active');

        // Keyword search — only apply if q is present and not empty
        if ($request->filled('q') && strlen(trim($request->q)) > 0) {
            $search = trim($request->q);
            $query->where(function ($q) use ($search) {
                $q->whereRaw(
                    "to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery(?)",
                    [$search]
                )->orWhere('title', 'ilike', '%' . $search . '%');
            });
        }

        // Filters
        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->category_id);
        }

        if ($request->filled('subcategory_id')) {
            if (is_numeric($request->subcategory_id)) {
                $query->where('subcategory_id', (int) $request->subcategory_id);
            } else {
                $query->whereHas('subcategory', function ($q) use ($request) {
                    $q->where('subcategory_name', 'ilike', '%' . $request->subcategory_id . '%');
                });
            }
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

        // Sorting
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

        $products = $query->paginate(20);

        // Append seller avg rating
        $products->getCollection()->transform(function ($product) {
            $product->seller_avg_rating = $this->getSellerAvgRating($product->seller_id);
            return $product;
        });

        return ApiResponse::success($products);
    }

    public function show(string $id)
    {
        $product = Product::with([
            'seller:user_id,name,profile_photo_url',
            'category:category_id,category_name',
        ])->where('product_id', $id)->first();

        if (! $product) {
            return ApiResponse::error('Product not found', 404);
        }

        $product->seller_avg_rating = $this->getSellerAvgRating($product->seller_id);

        return ApiResponse::success($product);
    }

    public function store(StoreProductRequest $request)
    {
        $seller = auth('api')->user();

        if ($seller->role === 'admin') {
            return ApiResponse::error('Administrators cannot create listings', 403);
        }

        $imagePaths = [];
        foreach ($request->file('images') as $image) {
            $path = $image->store('products', 'public');
            $imagePaths[] = '/storage/' . $path;
        }

        $product = Product::create([
            'product_id'  => Str::uuid(),
            'seller_id'   => $seller->user_id,
            'category_id' => $request->category_id,
            'subcategory_id' => $request->subcategory_id ?? null,
            'title'       => $request->title,
            'description' => $request->description,
            'price'       => $request->price,
            'condition'   => $request->condition,
            'images'      => $imagePaths,
            'status'      => 'draft',
            'location'    => $request->location,
            'expires_at'  => now()->addDays(60),
        ]);

        return ApiResponse::created([
            'product'     => $product,
            'next_step'   => 'Pay listing fee to publish',
            'payment_url' => url("/api/v1/payments/checkout/{$product->product_id}"),
        ], 'Listing created as draft. Complete payment to publish.');
    }

    public function update(UpdateProductRequest $request, string $id)
    {
        $product = Product::where('product_id', $id)
            ->where('seller_id', auth('api')->user()->user_id)
            ->first();

        if (! $product) {
            return ApiResponse::error('Product not found or you do not own this listing', 404);
        }

        if (! in_array($product->status, ['draft', 'active'])) {
            return ApiResponse::error('Only draft or active listings can be edited', 422);
        }

        $product->update($request->validated());

        return ApiResponse::success($product, 'Listing updated');
    }

    public function destroy(string $id)
    {
        $product = Product::where('product_id', $id)
            ->where('seller_id', auth('api')->user()->user_id)
            ->first();

        if (! $product) {
            return ApiResponse::error('Product not found or you do not own this listing', 404);
        }

        $product->update(['status' => 'archived']);

        return ApiResponse::success(null, 'Listing archived successfully');
    }

    public function markSold(string $id)
    {
        $product = Product::where('product_id', $id)
            ->where('seller_id', auth('api')->user()->user_id)
            ->first();

        if (! $product) {
            return ApiResponse::error('Product not found or you do not own this listing', 404);
        }

        $product->update(['status' => 'sold']);

        return ApiResponse::success(null, 'Listing marked as sold');
    }

    public function categories()
    {
        $categories = \App\Models\Category::with('subcategories')
            ->where('is_active', true)
            ->get();

        return ApiResponse::success($categories);
    }

    private function getSellerAvgRating(string $sellerId): float|null
    {
        $avg = \App\Models\Review::where('seller_id', $sellerId)
            ->where('is_removed', false)
            ->avg('rating');

        return $avg ? round($avg, 1) : null;
    }

    public function sellerListings(Request $request)
    {
        $seller = auth('api')->user();

        $query = Product::with(['category:category_id,category_name'])
            ->where('seller_id', $seller->user_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return ApiResponse::success($products);
    }

    public function forceActivate(string $id)
    {
        $seller = auth('api')->user();

        $product = Product::where('product_id', $id)
            ->where('seller_id', $seller->user_id)
            ->first();

        if (!$product) {
            return ApiResponse::error('Product not found or you do not own this listing', 404);
        }

        if ($product->status === 'active') {
            return ApiResponse::error('Product is already active', 422);
        }

        if ($product->status === 'sold') {
            return ApiResponse::error('Cannot activate a sold listing', 422);
        }

        if ($product->status === 'archived') {
            return ApiResponse::error('Cannot activate an archived listing', 422);
        }

        $payment = \App\Models\Payment::where('product_id', $product->product_id)
            ->where('seller_id', $seller->user_id)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if (!$payment) {
            return ApiResponse::error('Payment required. Please pay the listing fee to activate.', 402);
        }

        if ($payment->status === 'pending') {
            return ApiResponse::error('Payment is pending. Please complete payment to activate.', 422);
        }

        $product->update(['status' => 'active']);

        return ApiResponse::success($product, 'Product activated successfully');
    }

    // GET /api/v1/products/{id}/interest-status
public function interestStatus(string $id)
{
    $user = auth('api')->user();

    $order = \App\Models\Order::where('product_id', $id)
        ->where('buyer_id', $user->user_id)
        ->whereIn('status', ['pending', 'confirmed'])
        ->first();

    return ApiResponse::success([
        'has_interest' => $order !== null,
        'order_id'     => $order?->order_id,
        'status'       => $order?->status,
    ]);
}
}