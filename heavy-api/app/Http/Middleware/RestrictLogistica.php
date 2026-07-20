<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para restringir el rol Logística exclusivamente a órdenes de trabajo.
 *
 * Bloquea el acceso a cualquier ruta que no sea /ordenes-trabajo* para usuarios con rol Logistica.
 */
class RestrictLogistica
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->hasRole('Logistica')) {
            $route = $request->route();
            $uri = $route ? $route->uri : $request->path();
            $routeName = $route?->getName();

            // Permitir acceso únicamente a rutas de órdenes de trabajo
            if (! str_starts_with($uri, 'v1/ordenes-trabajo')) {
                abort(403, 'Acceso denegado: El rol Logística solo tiene acceso a órdenes de trabajo.');
            }

            if ($routeName === 'ordenes-trabajo.recepciones-compra.store') {
                return $next($request);
            }

            // Bloquear métodos de escritura (POST, PUT, PATCH, DELETE) en órdenes de trabajo
            if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                abort(403, 'Acceso denegado: El rol Logística solo tiene acceso de lectura a órdenes de trabajo.');
            }
        }

        return $next($request);
    }
}
