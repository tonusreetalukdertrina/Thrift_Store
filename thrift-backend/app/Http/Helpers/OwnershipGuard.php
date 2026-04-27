<?php

namespace App\Http\Helpers;

class OwnershipGuard
{
    public static function check(
        string $ownerId,
        string $requestUserId,
        string $message = 'You do not have permission to access this resource'
    ): ?\Illuminate\Http\JsonResponse {
        if ($ownerId !== $requestUserId) {
            return ApiResponse::error($message, 403);
        }
        return null;
    }
}