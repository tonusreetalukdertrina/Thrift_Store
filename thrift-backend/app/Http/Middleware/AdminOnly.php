<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminOnly
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $role    = $payload->get('role');

            if ($role !== 'admin') {
                return ApiResponse::error('Forbidden. Admin access only.', 403);
            }
        } catch (\Exception $e) {
            return ApiResponse::error('Unauthenticated', 401);
        }

        return $next($request);
    }
}