<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// ── API Documentation (Swagger) ──────────────────────────────────
Route::get('/api/docs/openapi.json', function () {
    $path = storage_path('api-docs/openapi.json');
    if (! file_exists($path)) {
        abort(404, 'openapi.json not found');
    }
    return response()->file($path, ['Content-Type' => 'application/json']);
});

Route::get('/api/docs', function () {
    $specUrl = url('/api/docs/openapi.json');
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Thrift Store API – Swagger UI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; }
        *, *::before, *::after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '{$specUrl}',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
            ],
        });
    </script>
</body>
</html>
HTML;
});
