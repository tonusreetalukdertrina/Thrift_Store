<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
    Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:auth');

    Route::get('/products',      [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/categories',    [ProductController::class, 'categories']);

    Route::get('/sellers/{id}',         [ReviewController::class, 'sellerProfile']);
    Route::get('/sellers/{id}/reviews', [ReviewController::class, 'sellerReviews']);

    Route::post('/webhook/stripe', [PaymentController::class, 'handleWebhook']);
});

// ── Authenticated ────────────────────────────────────────────────
Route::prefix('v1')->middleware(['auth:api', 'blocked'])->group(function () {

    Route::post('/auth/logout',  [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

Route::get('/profile',                  [ProfileController::class, 'show']);
    Route::post('/profile',                 [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
    Route::delete('/profile',               [ProfileController::class, 'deleteAccount']);

    // Products
    Route::post('/products',            [ProductController::class, 'store']);
    Route::put('/products/{id}',        [ProductController::class, 'update']);
    Route::delete('/products/{id}',     [ProductController::class, 'destroy']);
    Route::patch('/products/{id}/sold', [ProductController::class, 'markSold']);

    // Payments
    Route::get('/payments',          [PaymentController::class, 'index']);
    Route::get('/payments/due',      [PaymentController::class, 'due']);
    Route::post('/payments/checkout',[PaymentController::class, 'createCheckoutSession']);

    Route::get('/seller/listings', [ProductController::class, 'sellerListings']);
    Route::patch('/seller/products/{id}/activate', [ProductController::class, 'forceActivate']);
    Route::post('/payments/verify', [PaymentController::class, 'verifyAndActivate']);
    Route::post('/payments/activate-drafts', [PaymentController::class, 'activateDrafts']);

    // Orders
    // Orders / Interests
    Route::post('/orders',                         [OrderController::class, 'store']);
    Route::get('/orders',                          [OrderController::class, 'buyerOrders']);
    Route::get('/orders/{id}',                     [OrderController::class, 'show']);
    Route::patch('/orders/{id}/confirm',           [OrderController::class, 'confirm']);
    Route::patch('/orders/{id}/cancel',            [OrderController::class, 'cancel']);
    Route::patch('/orders/{id}/complete',          [OrderController::class, 'complete']);
    Route::get('/seller/orders',                   [OrderController::class, 'sellerOrders']);
    Route::get('/seller/stats',                    [OrderController::class, 'sellerStats']);

    // Reviews
    Route::post('/reviews',              [ReviewController::class, 'store']);
    Route::post('/reviews/{id}/respond', [ReviewController::class, 'respond']);

    // Wishlist
    Route::get('/wishlist',                 [WishlistController::class, 'index']);
    Route::post('/wishlist',                [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product_id}', [WishlistController::class, 'destroy']);

    // Notifications
    Route::get('/notifications',             [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all',  [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Reports
    Route::post('/reports', [ReportController::class, 'store']);

    Route::get('/seller/stats', [OrderController::class, 'sellerStats']);
});

// ── Admin only ───────────────────────────────────────────────────
Route::prefix('v1/admin')->middleware(['auth:api', 'blocked', 'admin.only'])->group(function () {

    Route::get('/stats',      [AdminController::class, 'stats']);
    Route::get('/audit-log',  [AdminController::class, 'auditLog']);

    // Users
    Route::get('/users',                [AdminController::class, 'listUsers']);
    Route::patch('/users/{id}/block',   [AdminController::class, 'blockUser']);
    Route::patch('/users/{id}/unblock', [AdminController::class, 'unblockUser']);

    // Products
    Route::get('/products',        [AdminController::class, 'listProducts']);
    Route::delete('/products/{id}',[AdminController::class, 'removeProduct']);

    // Reviews
    Route::delete('/reviews/{id}', [AdminController::class, 'removeReview']);

    // Reports
    Route::get('/reports',                    [AdminController::class, 'listReports']);
    Route::patch('/reports/{id}/resolve',     [AdminController::class, 'resolveReport']);

    // Categories
    Route::post('/categories',       [AdminController::class, 'createCategory']);
    Route::put('/categories/{id}',   [AdminController::class, 'updateCategory']);

    // Products — seller actions
    Route::post('/products',                        [ProductController::class, 'store']);
    Route::put('/products/{id}',                    [ProductController::class, 'update'])->middleware('seller.owns');
    Route::delete('/products/{id}',                 [ProductController::class, 'destroy'])->middleware('seller.owns');
    Route::patch('/products/{id}/sold',             [ProductController::class, 'markSold'])->middleware('seller.owns');
    Route::get('/payments/checkout/{product_id}',   [PaymentController::class, 'createCheckoutSession'])->middleware('seller.owns');

    Route::patch('/products/{id}/restore', [AdminController::class, 'restoreProduct']);

    Route::get('/payments', [AdminController::class, 'listPayments']);

    Route::get('/subcategories',           [AdminController::class, 'listSubcategories']);
    Route::post('/subcategories',          [AdminController::class, 'createSubcategory']);
    Route::put('/subcategories/{id}',      [AdminController::class, 'updateSubcategory']);

    Route::get('/products/{id}/interest-status', [ProductController::class, 'interestStatus']);
});