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
     * Rutas de Orden de Compra permitidas para Logística pese a no vivir bajo
     * /ordenes-trabajo: el flujo de recepción de mercancía se registra ahora
     * directamente desde la OC (ver issues #147-#157).
     *
     * @var array<int, string>
     */
    private const RUTAS_RECEPCION_ORDEN_COMPRA_PERMITIDAS = [
        'ordenes-compra.recepciones.store',
        'ordenes-compra.recepciones.index',
        'recepciones-compra.imagenes.store',
    ];

    /**
     * Logística necesita poder listar y ver el detalle de una OC para llegar
     * al botón "Registrar Recepción" (no implica acceso de escritura al recurso OC).
     *
     * @var array<int, string>
     */
    private const RUTAS_ORDEN_COMPRA_SOLO_LECTURA = [
        'ordenes-compra.index',
        'ordenes-compra.show',
    ];

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

            if (in_array($routeName, self::RUTAS_RECEPCION_ORDEN_COMPRA_PERMITIDAS, true)) {
                return $next($request);
            }

            if ($request->isMethod('GET') && in_array($routeName, self::RUTAS_ORDEN_COMPRA_SOLO_LECTURA, true)) {
                return $next($request);
            }

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
