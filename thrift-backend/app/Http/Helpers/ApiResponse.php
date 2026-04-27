<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success($data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'data'   => $data,
            'meta'   => ['message' => $message],
            'errors' => [],
        ], $status);
    }

    public static function created($data = null, string $message = 'Created'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function error(string $message = 'Error', int $status = 400, array $errors = []): JsonResponse
    {
        return response()->json([
            'data'   => null,
            'meta'   => ['message' => $message],
            'errors' => $errors,
        ], $status);
    }
}