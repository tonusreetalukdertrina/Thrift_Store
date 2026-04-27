<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;

class CheckBlocked
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth('api')->user();

        if ($user && $user->is_blocked) {
            return ApiResponse::error('Your account has been blocked.', 403);
        }

        return $next($request);
    }
}