<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'user_id'       => Str::uuid(),
            'name'          => $request->name,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'password_hash' => bcrypt($request->password),
            'role'          => 'user',
            'is_blocked'    => false,
        ]);

        $token = JWTAuth::fromUser($user);

        return ApiResponse::created([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Registration successful');
    }

    public function login(LoginRequest $request)
    {
        $credentials = [
            'email'    => $request->email,
            'password' => $request->password,
        ];

        if (! $token = auth('api')->attempt($credentials)) {
            return ApiResponse::error('Invalid email or password', 401);
        }

        $user = auth('api')->user();

        if ($user->is_blocked) {
            auth('api')->logout();
            return ApiResponse::error('Your account has been blocked. Please contact support.', 403);
        }

        return ApiResponse::success([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Login successful');
    }

    public function logout()
    {
        auth('api')->logout();
        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return ApiResponse::success(['token' => $token], 'Token refreshed');
        } catch (\Exception $e) {
            return ApiResponse::error('Token refresh failed', 401);
        }
    }

    private function formatUser(User $user): array
    {
        return [
            'user_id'           => $user->user_id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'role'              => $user->role,
            'profile_photo_url' => $user->profile_photo_url,
        ];
    }
}