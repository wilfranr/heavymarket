<?php

use App\Http\Middleware\RestrictLogistica;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

// Aumentar límites de subida de archivos para componentes de máquinas
ini_set('upload_max_filesize', '20M');
ini_set('post_max_size', '25M');
ini_set('max_file_uploads', '50');

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: '',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'v1/*',
            'broadcasting/auth',
        ]);
        $middleware->statefulApi();
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
        $middleware->appendToGroup('api', [
            RestrictLogistica::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
