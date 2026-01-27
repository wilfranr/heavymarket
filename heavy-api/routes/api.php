<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\{
    AuthController,
    PedidoController,
    TerceroController,
    CotizacionController,
    OrdenCompraController,
    OrdenTrabajoController,
    ArticuloController,
    ReferenciaController,
    UserController,
    FabricanteController,
    SistemaController,
    MaquinaController,
    CategoriaController,
    ListaController,
    EmpresaController,
    ContactoController,
    DireccionController,
    TransportadoraController,
    TRMController
};

/**
 * Rutas API versión 1
 * 
 * Todas las rutas están protegidas con autenticación Sanctum
 * y agrupadas bajo el prefijo /api/v1
 */
Route::prefix('v1')->group(function () {
    
    /**
     * Ruta de prueba sin autenticación
     */
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'message' => 'HeavyMarket API v1',
            'timestamp' => now()->toISOString(),
        ]);
    });

    /**
     * Rutas de autenticación (sin protección)
     */
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    /**
     * Rutas protegidas con autenticación Sanctum
     */
    Route::middleware('auth:sanctum')->group(function () {
        
        /**
         * Gestión de autenticación (requiere estar autenticado)
         */
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/tokens', [AuthController::class, 'tokens']);
        Route::delete('/tokens/{tokenId}', [AuthController::class, 'revokeToken']);
        
        /**
         * Información del usuario autenticado
         */
        Route::get('/user', function (Request $request) {
            return response()->json([
                'data' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->roles->pluck('name'),
                    'permissions' => $request->user()->permissions->pluck('name'),
                ],
            ]);
        });

        /**
         * Recursos principales del sistema
         */
        Route::apiResource('pedidos', PedidoController::class);
        
        // Rutas adicionales para gestión de referencias en pedidos
        Route::post('pedidos/{pedido}/referencias', [PedidoController::class, 'addReferencia'])->name('pedidos.referencias.store');
        Route::put('pedidos/{pedido}/referencias/{referencia}', [PedidoController::class, 'updateReferencia'])->name('pedidos.referencias.update');
        Route::delete('pedidos/{pedido}/referencias/{referencia}', [PedidoController::class, 'deleteReferencia'])->name('pedidos.referencias.destroy');
        
        // Rutas adicionales para gestión de proveedores en referencias de pedidos
        Route::post('pedidos/{pedido}/referencias/{referencia}/proveedores', [PedidoController::class, 'addProveedor'])->name('pedidos.referencias.proveedores.store');
        Route::put('pedidos/{pedido}/referencias/{referencia}/proveedores/{proveedor}', [PedidoController::class, 'updateProveedor'])->name('pedidos.referencias.proveedores.update');
        Route::delete('pedidos/{pedido}/referencias/{referencia}/proveedores/{proveedor}', [PedidoController::class, 'deleteProveedor'])->name('pedidos.referencias.proveedores.destroy');
        
        // Rutas adicionales para gestión de artículos en pedidos
        Route::post('pedidos/{pedido}/articulos', [PedidoController::class, 'addArticulo'])->name('pedidos.articulos.store');
        Route::put('pedidos/{pedido}/articulos/{articulo}', [PedidoController::class, 'updateArticulo'])->name('pedidos.articulos.update');
        Route::delete('pedidos/{pedido}/articulos/{articulo}', [PedidoController::class, 'deleteArticulo'])->name('pedidos.articulos.destroy');
        Route::apiResource('terceros', TerceroController::class);
        Route::apiResource('cotizaciones', CotizacionController::class);
        Route::apiResource('ordenes-compra', OrdenCompraController::class);
        Route::apiResource('ordenes-trabajo', OrdenTrabajoController::class);
        
        /**
         * Catálogos y referencias
         */
        Route::apiResource('articulos', ArticuloController::class);
        Route::apiResource('referencias', ReferenciaController::class);
        Route::apiResource('fabricantes', FabricanteController::class);
        Route::apiResource('sistemas', SistemaController::class);
        Route::apiResource('maquinas', MaquinaController::class);
        Route::apiResource('categorias', CategoriaController::class);
        Route::apiResource('listas', ListaController::class);
        Route::get('listas/tipo/{tipo}', [ListaController::class, 'getByTipo'])->name('listas.by-tipo');
        
        /**
         * Módulos auxiliares
         */
        Route::apiResource('empresas', EmpresaController::class);
        Route::apiResource('contactos', ContactoController::class);
        Route::apiResource('direcciones', DireccionController::class);
        Route::apiResource('transportadoras', TransportadoraController::class);
        Route::apiResource('trms', TRMController::class);
        Route::get('trms/latest', [TRMController::class, 'latest'])->name('trms.latest');
        
        /**
         * Gestión de usuarios (solo admin)
         */
        Route::apiResource('users', UserController::class)
            ->middleware('role:super_admin|Administrador');
    });
});
