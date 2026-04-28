<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\AuditLog;
use App\Models\Listing;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Report;
use App\Models\Review;
use App\Models\User;
use App\Services\AuditService;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function listUsers(Request $request)
    {
        $query = User::query();

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($query) use ($q) {
                $query->where('name', 'ilike', "%{$q}%")
                      ->orWhere('email', 'ilike', "%{$q}%")
                      ->orWhere('phone', 'ilike', "%{$q}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_blocked')) {
            $query->where('is_blocked', $request->boolean('is_blocked'));
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return ApiResponse::success($users);
    }

    public function blockUser(string $id)
    {
        $admin = auth('api')->user();
        $user  = User::where('user_id', $id)->first();

        if (! $user) {
            return ApiResponse::error('User not found', 404);
        }

        if ($user->role === 'admin') {
            return ApiResponse::error('Cannot block another admin', 403);
        }

        $user->update(['is_blocked' => true]);

        Listing::where('seller_id', $id)
            ->where('status', 'active')
            ->update(['status' => 'archived']);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $id,
            'type'            => 'account_blocked',
            'body'            => 'Your account has been blocked by an administrator. Please contact support.',
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'block_user', 'user', $id, [
            'blocked_user_email' => $user->email,
        ]);

        return ApiResponse::success(null, 'User blocked and listings archived');
    }

    public function unblockUser(string $id)
    {
        $admin = auth('api')->user();
        $user  = User::where('user_id', $id)->first();

        if (! $user) {
            return ApiResponse::error('User not found', 404);
        }

        $user->update(['is_blocked' => false]);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $id,
            'type'            => 'account_unblocked',
            'body'            => 'Your account has been reinstated. You can now log in.',
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'unblock_user', 'user', $id);

        return ApiResponse::success(null, 'User unblocked successfully');
    }

    public function listListings(Request $request)
    {
        $query = Listing::with([
            'seller:user_id,name,email',
            'category:category_id,category_name',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $query->where('title', 'ilike', '%' . $request->q . '%');
        }

        $listings = $query->orderBy('created_at', 'desc')->paginate(20);

        return ApiResponse::success($listings);
    }

    public function removeListing(string $id)
    {
        $admin   = auth('api')->user();
        $listing = Listing::where('listing_id', $id)->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found', 404);
        }

        $cloudinary = new CloudinaryService('listings');
        $cloudinary->deleteImages($listing->images ?? []);

        $listing->update(['status' => 'archived']);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $listing->seller_id,
            'type'            => 'listing_removed',
            'body'            => "Your listing \"{$listing->title}\" has been removed by an administrator for violating platform policy.",
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'remove_listing', 'listing', $id, [
            'listing_title' => $listing->title,
            'seller_id'     => $listing->seller_id,
        ]);

        return ApiResponse::success(null, 'Listing removed and seller notified');
    }

    public function restoreListing(string $id)
    {
        $admin   = auth('api')->user();
        $listing = Listing::where('listing_id', $id)->first();

        if (! $listing) {
            return ApiResponse::error('Listing not found', 404);
        }

        if ($listing->status !== 'archived') {
            return ApiResponse::error('Only archived listings can be restored', 422);
        }

        $listing->update(['status' => 'active']);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $listing->seller_id,
            'type'            => 'listing_restored',
            'body'            => "Your listing \"{$listing->title}\" has been restored by an administrator.",
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'restore_listing', 'listing', $id, [
            'listing_title' => $listing->title,
            'seller_id'     => $listing->seller_id,
        ]);

        return ApiResponse::success(null, 'Listing restored successfully');
    }

    public function removeReview(string $id)
    {
        $admin  = auth('api')->user();
        $review = Review::where('review_id', $id)->first();

        if (! $review) {
            return ApiResponse::error('Review not found', 404);
        }

        $review->update([
            'is_removed' => true,
            'removed_by' => $admin->user_id,
        ]);

        AuditService::log($admin->user_id, 'remove_review', 'review', $id, [
            'seller_id' => $review->seller_id,
            'buyer_id'  => $review->buyer_id,
            'rating'    => $review->rating,
        ]);

        return ApiResponse::success(null, 'Review removed');
    }

    public function listReports(Request $request)
    {
        $query = Report::with('reporter:user_id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('target_type')) {
            $query->where('target_type', $request->target_type);
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(20);

        return ApiResponse::success($reports);
    }

    public function resolveReport(Request $request, string $id)
    {
        $request->validate([
            'action'      => ['required', 'in:dismiss,warn,remove,block'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $admin  = auth('api')->user();
        $report = Report::where('report_id', $id)->first();

        if (! $report) {
            return ApiResponse::error('Report not found', 404);
        }

        $report->update([
            'status'      => 'resolved',
            'admin_id'    => $admin->user_id,
            'admin_notes' => $request->admin_notes,
            'resolved_at' => now(),
        ]);

        switch ($request->action) {
            case 'remove':
                if ($report->target_type === 'listing') {
                    Listing::where('listing_id', $report->target_id)
                        ->update(['status' => 'archived']);
                }
                if ($report->target_type === 'review') {
                    Review::where('review_id', $report->target_id)
                        ->update(['is_removed' => true, 'removed_by' => $admin->user_id]);
                }
                break;

            case 'block':
                if ($report->target_type === 'user') {
                    User::where('user_id', $report->target_id)
                        ->update(['is_blocked' => true]);
                    Listing::where('seller_id', $report->target_id)
                        ->where('status', 'active')
                        ->update(['status' => 'archived']);
                }
                break;
        }

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $report->reporter_id,
            'type'            => 'report_resolved',
            'body'            => 'Your report has been reviewed and action has been taken by our moderation team.',
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'resolve_report', 'report', $id, [
            'action'      => $request->action,
            'target_type' => $report->target_type,
            'target_id'   => $report->target_id,
        ]);

        return ApiResponse::success(null, 'Report resolved');
    }

    public function createCategory(Request $request)
    {
        $request->validate([
            'category_name' => ['required', 'string', 'max:255', 'unique:categories,category_name'],
            'description'   => ['nullable', 'string'],
        ]);

        $category = \App\Models\Category::create([
            'category_name' => $request->category_name,
            'description'   => $request->description,
            'is_active'     => true,
        ]);

        AuditService::log(
            auth('api')->user()->user_id,
            'create_category',
            'category',
            (string) $category->category_id
        );

        return ApiResponse::created($category, 'Category created');
    }

    public function updateCategory(Request $request, string $id)
    {
        $request->validate([
            'category_name' => ['sometimes', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        $category = \App\Models\Category::where('category_id', $id)->first();

        if (! $category) {
            return ApiResponse::error('Category not found', 404);
        }

        $category->update($request->only(['category_name', 'description', 'is_active']));

        AuditService::log(
            auth('api')->user()->user_id,
            'update_category',
            'category',
            $id,
            $request->only(['category_name', 'is_active'])
        );

        return ApiResponse::success($category, 'Category updated');
    }

    public function stats()
    {
        $revenue = Payment::where('status', 'paid')
            ->selectRaw('COALESCE(SUM(amount::numeric), 0) as total')
            ->value('total');

        return ApiResponse::success([
            'total_users'           => User::where('role', '!=', 'admin')->count(),
            'total_active_listings' => Listing::where('status', 'active')->count(),
            'total_revenue'         => round((float) $revenue, 2),
            'pending_reports'       => Report::where('status', 'pending')->count(),
            'blocked_users'         => User::where('is_blocked', true)->count(),
            'listings_by_status'    => Listing::selectRaw('status, count(*) as count')
                                        ->groupBy('status')
                                        ->pluck('count', 'status'),
        ]);
    }

    public function auditLog(Request $request)
    {
        $query = AuditLog::with('admin:user_id,name,email')
            ->orderBy('log_id', 'desc');

        if ($request->filled('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->paginate(50);

        return ApiResponse::success($logs);
    }

    public function listPayments(Request $request)
    {
        $query = Payment::with([
            'seller:user_id,name,email',
            'listing:listing_id,title',
        ])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $query->whereHas('seller', function ($q) use ($request) {
                $q->where('email', 'ilike', '%' . $request->q . '%')
                ->orWhere('name',  'ilike', '%' . $request->q . '%');
            });
        }

        $payments = $query->paginate(30);

        $totalPaid   = Payment::where('status', 'paid')->sum('amount');
        $totalFailed = Payment::where('status', 'failed')->count();
        $totalPending= Payment::where('status', 'pending')->count();

        return ApiResponse::success([
            'payments' => $payments,
            'summary'  => [
                'total_paid'    => round((float) $totalPaid, 2),
                'failed_count'  => $totalFailed,
                'pending_count' => $totalPending,
            ],
        ]);
    }
}
