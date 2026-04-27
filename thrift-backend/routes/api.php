<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
    Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:auth');

    Route::get('/listings',      [ListingController::class, 'index']);
    Route::get('/listings/{id}', [ListingController::class, 'show']);
    Route::get('/categories',    [ListingController::class, 'categories']);

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

    // Listings
    Route::post('/listings',                 [ListingController::class, 'store']);
    Route::put('/listings/{id}',             [ListingController::class, 'update']);
    Route::delete('/listings/{id}',          [ListingController::class, 'destroy']);
    Route::patch('/listings/{id}/status',    [ListingController::class, 'updateStatus']);
    Route::get('/my-listings',               [ListingController::class, 'myListings']);

    // Payments
    Route::get('/payments',          [PaymentController::class, 'index']);
    Route::get('/payments/due',      [PaymentController::class, 'due']);
    Route::post('/payments/checkout',[PaymentController::class, 'createCheckoutSession']);
    Route::post('/payments/verify',  [PaymentController::class, 'verifyAndActivate']);

    // Reviews
    Route::post('/reviews',              [ReviewController::class, 'store']);
    Route::post('/reviews/{id}/respond', [ReviewController::class, 'respond']);

    // Notifications
    Route::get('/notifications',             [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all',  [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Reports
    Route::post('/reports', [ReportController::class, 'store']);

});

// ── Admin only ───────────────────────────────────────────────────
Route::prefix('v1/admin')->middleware(['auth:api', 'blocked', 'admin.only'])->group(function () {
    Route::get('/stats',      [AdminController::class, 'stats']);
    Route::get('/audit-log',  [AdminController::class, 'auditLog']);

    // Users
    Route::get('/users',                [AdminController::class, 'listUsers']);
    Route::patch('/users/{id}/block',   [AdminController::class, 'blockUser']);
    Route::patch('/users/{id}/unblock', [AdminController::class, 'unblockUser']);

    // Listings
    Route::get('/listings',         [AdminController::class, 'listListings']);
    Route::delete('/listings/{id}', [AdminController::class, 'removeListing']);
    Route::patch('/listings/{id}/restore', [AdminController::class, 'restoreListing']);

    // Reviews
    Route::delete('/reviews/{id}', [AdminController::class, 'removeReview']);

    // Reports
    Route::get('/reports',                    [AdminController::class, 'listReports']);
    Route::patch('/reports/{id}/resolve',     [AdminController::class, 'resolveReport']);

    // Payments
    Route::get('/payments', [AdminController::class, 'listPayments']);

    // Categories (admin only)
    Route::post('/categories',       [AdminController::class, 'createCategory']);
    Route::put('/categories/{id}',   [AdminController::class, 'updateCategory']);
});
