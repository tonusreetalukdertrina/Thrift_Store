<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show()
    {
        $user = auth('api')->user();

        return ApiResponse::success([
            'user_id'           => $user->user_id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'role'              => $user->role,
            'profile_photo_url' => $user->profile_photo_url,
            'is_blocked'        => $user->is_blocked,
            'created_at'        => $user->created_at,
        ]);
    }

    public function update(Request $request)
    {
        $user = auth('api')->user();

        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'unique:users,phone,' . $user->user_id . ',user_id'],
        ]);

        if ($request->hasFile('profile_photo')) {
            $request->validate([
                'profile_photo' => ['image', 'mimes:jpeg,png,webp', 'max:5120'],
            ]);

            // Delete old photo
            if ($user->profile_photo_url) {
                $oldPath = str_replace('/storage/', 'public/', $user->profile_photo_url);
                Storage::delete($oldPath);
            }

            $path = $request->file('profile_photo')->store('profile_photos', 'public');
            $validated['profile_photo_url'] = '/storage/' . $path;
        }

        $user->update($validated);
        $user->refresh();

        return ApiResponse::success([
            'user_id'           => $user->user_id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'role'              => $user->role,
            'profile_photo_url' => $user->profile_photo_url,
        ], 'Profile updated');
    }

public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => [
                'required',
                'string',
                'min:6',
            ],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ]);

        $user = auth('api')->user();

        if (! \Illuminate\Support\Facades\Hash::check($request->current_password, $user->password_hash)) {
            return ApiResponse::error('Current password is incorrect', 422);
        }

        if ($request->current_password === $request->new_password) {
            return ApiResponse::error('New password must be different from current password', 422);
        }

        $user->update(['password_hash' => bcrypt($request->new_password)]);

        return ApiResponse::success(null, 'Password changed successfully. Please log in again.');
    }

    public function deleteAccount(Request $request)
{
    $request->validate([
        'password' => ['required', 'string'],
    ]);

    $user = auth('api')->user();

    if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password_hash)) {
        return ApiResponse::error('Password is incorrect', 422);
    }

    // Archive all listings
    Product::where('seller_id', $user->user_id)
        ->whereIn('status', ['active', 'draft'])
        ->update(['status' => 'archived']);

    // Anonymize
    $user->update([
        'name'              => 'Deleted User',
        'phone'             => 'deleted_' . substr($user->user_id, 0, 8),
        'password_hash'     => bcrypt(\Illuminate\Support\Str::random(32)),
        'profile_photo_url' => null,
        'is_blocked'        => true,
    ]);

    try {
        \Tymon\JWTAuth\Facades\JWTAuth::invalidate(\Tymon\JWTAuth\Facades\JWTAuth::getToken());
    } catch (\Exception $_) {}

    return ApiResponse::success(null, 'Account deleted successfully');
}
}