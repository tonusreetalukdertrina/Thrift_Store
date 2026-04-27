<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Notification;

class NotificationController extends Controller
{
    // GET /api/v1/notifications
    public function index()
    {
        $notifications = Notification::where('user_id', auth('api')->user()->user_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = Notification::where('user_id', auth('api')->user()->user_id)
            ->where('status', 'unread')
            ->count();

        return ApiResponse::success([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    // PATCH /api/v1/notifications/{id}/read
    public function markRead(string $id)
    {
        Notification::where('notification_id', $id)
            ->where('user_id', auth('api')->user()->user_id)
            ->update(['status' => 'read']);

        return ApiResponse::success(null, 'Marked as read');
    }

    // PATCH /api/v1/notifications/read-all
    public function markAllRead()
    {
        Notification::where('user_id', auth('api')->user()->user_id)
            ->where('status', 'unread')
            ->update(['status' => 'read']);

        return ApiResponse::success(null, 'All notifications marked as read');
    }
}