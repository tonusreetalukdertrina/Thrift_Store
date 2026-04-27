<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Report;
use App\Models\Review;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // ── Users ───────────────────────────────────────────────────

    // GET /api/v1/admin/users
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

    // PATCH /api/v1/admin/users/{id}/block
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

        // Auto-archive all active listings
        Product::where('seller_id', $id)
            ->where('status', 'active')
            ->update(['status' => 'archived']);

        // Notify user
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

    // PATCH /api/v1/admin/users/{id}/unblock
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

    // ── Products ────────────────────────────────────────────────

    // GET /api/v1/admin/products
    public function listProducts(Request $request)
    {
        $query = Product::with([
            'seller:user_id,name,email',
            'category:category_id,category_name',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $query->where('title', 'ilike', '%' . $request->q . '%');
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(20);

        return ApiResponse::success($products);
    }

    // DELETE /api/v1/admin/products/{id}
    public function removeProduct(string $id)
    {
        $admin   = auth('api')->user();
        $product = Product::where('product_id', $id)->first();

        if (! $product) {
            return ApiResponse::error('Product not found', 404);
        }

        $product->update(['status' => 'archived']);

        Notification::create([
            'notification_id' => Str::uuid(),
            'user_id'         => $product->seller_id,
            'type'            => 'listing_removed',
            'body'            => "Your listing \"{$product->title}\" has been removed by an administrator for violating platform policy.",
            'status'          => 'unread',
        ]);

        AuditService::log($admin->user_id, 'remove_product', 'product', $id, [
            'product_title' => $product->title,
            'seller_id'     => $product->seller_id,
        ]);

        return ApiResponse::success(null, 'Listing removed and seller notified');
    }

    // ── Reviews ─────────────────────────────────────────────────

    // DELETE /api/v1/admin/reviews/{id}
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

    // ── Reports ─────────────────────────────────────────────────

    // GET /api/v1/admin/reports
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

    // PATCH /api/v1/admin/reports/{id}/resolve
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

        // Take action
        switch ($request->action) {
            case 'remove':
                if ($report->target_type === 'product') {
                    Product::where('product_id', $report->target_id)
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
                    Product::where('seller_id', $report->target_id)
                        ->where('status', 'active')
                        ->update(['status' => 'archived']);
                }
                break;
        }

        // Notify reporter of outcome
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

    // ── Categories ───────────────────────────────────────────────

    // POST /api/v1/admin/categories
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

    // PUT /api/v1/admin/categories/{id}
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

    // ── Stats ────────────────────────────────────────────────────

    // GET /api/v1/admin/stats
    public function stats()
    {
        $revenue = \App\Models\Payment::where('status', 'paid')
            ->selectRaw('COALESCE(SUM(amount::numeric), 0) as total')
            ->value('total');

        return ApiResponse::success([
            'total_users'           => \App\Models\User::where('role', '!=', 'admin')->count(),
            'total_active_listings' => \App\Models\Product::where('status', 'active')->count(),
            'total_revenue'         => round((float) $revenue, 2),
            'total_orders'          => \App\Models\Order::count(),
            'pending_reports'       => \App\Models\Report::where('status', 'pending')->count(),
            'blocked_users'         => \App\Models\User::where('is_blocked', true)->count(),
            'orders_by_status'      => \App\Models\Order::selectRaw('status, count(*) as count')
                                        ->groupBy('status')
                                        ->pluck('count', 'status'),
        ]);
    }

    // ── Audit Log ────────────────────────────────────────────────

    // GET /api/v1/admin/audit-log
    public function auditLog(Request $request)
    {
        $query = AuditLog::with('admin:user_id,name,email')
            ->orderBy('log_id', 'desc'); // order by log_id instead of performed_at

        if ($request->filled('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->paginate(50);

        return ApiResponse::success($logs);
    }

    // PATCH /api/v1/admin/products/{id}/restore
    public function restoreProduct(string $id)
{
    $admin   = auth('api')->user();
    $product = Product::where('product_id', $id)->first();

    if (! $product) {
        return ApiResponse::error('Product not found', 404);
    }

    if ($product->status !== 'archived') {
        return ApiResponse::error('Only archived products can be restored', 422);
    }

    $product->update(['status' => 'active']);

    \App\Models\Notification::create([
        'notification_id' => \Illuminate\Support\Str::uuid(),
        'user_id'         => $product->seller_id,
        'type'            => 'listing_restored',
        'body'            => "Your listing \"{$product->title}\" has been restored by an administrator.",
        'status'          => 'unread',
    ]);

    AuditService::log($admin->user_id, 'restore_product', 'product', $id, [
        'product_title' => $product->title,
        'seller_id'     => $product->seller_id,
    ]);

    return ApiResponse::success(null, 'Product restored successfully');
}

    // GET /api/v1/admin/payments
    public function listPayments(Request $request)
    {
        $query = Payment::with([
            'seller:user_id,name,email',
            'product:product_id,title',
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

        // Summary stats
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

    // GET /api/v1/admin/subcategories
    public function listSubcategories(Request $request)
    {
        $query = \App\Models\Subcategory::with('category:category_id,category_name');
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        return ApiResponse::success($query->get());
    }

    // POST /api/v1/admin/subcategories
    public function createSubcategory(Request $request)
    {
        $request->validate([
            'category_id'      => ['required', 'integer', 'exists:categories,category_id'],
            'subcategory_name' => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
        ]);

        $sub = \App\Models\Subcategory::create([
            'category_id'      => $request->category_id,
            'subcategory_name' => $request->subcategory_name,
            'description'      => $request->description,
            'is_active'        => true,
        ]);

        AuditService::log(
            auth('api')->user()->user_id,
            'create_subcategory',
            'subcategory',
            (string) $sub->subcategory_id
        );

        return ApiResponse::created($sub, 'Subcategory created');
    }

    // PUT /api/v1/admin/subcategories/{id}
    public function updateSubcategory(Request $request, string $id)
    {
        $request->validate([
            'subcategory_name' => ['sometimes', 'string', 'max:255'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        $sub = \App\Models\Subcategory::where('subcategory_id', $id)->first();
        if (! $sub) return ApiResponse::error('Subcategory not found', 404);

        $sub->update($request->only(['subcategory_name', 'description', 'is_active']));

        AuditService::log(
            auth('api')->user()->user_id,
            'update_subcategory',
            'subcategory',
            $id
        );

        return ApiResponse::success($sub, 'Subcategory updated');
    }
}