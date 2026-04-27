<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(function () {
        \Illuminate\Support\Facades\RateLimiter::for('auth', function ($request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(10)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'data'   => null,
                        'meta'   => ['message' => 'Too many attempts. Please wait a minute.'],
                        'errors' => [],
                    ], 429);
                });
        });

        \Illuminate\Support\Facades\RateLimiter::for('api', function ($request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)
                ->by($request->user()?->user_id ?: $request->ip());
        });

        \Illuminate\Support\Facades\Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        \Illuminate\Support\Facades\Route::middleware('web')
            ->group(base_path('routes/web.php'));
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'blocked'           => \App\Http\Middleware\CheckBlocked::class,
            'admin.only'        => \App\Http\Middleware\AdminOnly::class,
            'seller.owns'       => \App\Http\Middleware\SellerOwnsListing::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/v1/webhook/stripe',
            'api/v1/webhook/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
    // Return JSON for all API errors instead of HTML
    $exceptions->render(function (\Throwable $e, $request) {
        if ($request->is('api/*')) {
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'data'   => null,
                    'meta'   => ['message' => 'Unauthenticated. Please log in.'],
                    'errors' => [],
                ], 401);
            }
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return response()->json([
                    'data'   => null,
                    'meta'   => ['message' => 'Resource not found.'],
                    'errors' => [],
                ], 404);
            }
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'data'   => null,
                    'meta'   => ['message' => 'Validation failed'],
                    'errors' => $e->errors(),
                ], 422);
            }
        }
    });
})->create();
