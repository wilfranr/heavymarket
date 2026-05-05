<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ArticuloController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoriaController;
use App\Http\Controllers\Api\V1\ClientAuthController;
use App\Http\Controllers\Api\V1\ContactoController;
use App\Http\Controllers\Api\V1\CotizacionController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DireccionController;
use App\Http\Controllers\Api\V1\EmpresaController;
use App\Http\Controllers\Api\V1\LandingController;
use App\Http\Controllers\Api\V1\ListaController;
use App\Http\Controllers\Api\V1\MaquinaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrdenCompraController;
use App\Http\Controllers\Api\V1\OrdenTrabajoController;
use App\Http\Controllers\Api\V1\PedidoController;
use App\Http\Controllers\Api\V1\ReferenciaController;
use App\Http\Controllers\Api\V1\SistemaController;
use App\Http\Controllers\Api\V1\TerceroController;
use App\Http\Controllers\Api\V1\TransportadoraController;
use App\Http\Controllers\Api\V1\TRMController;
use App\Http\Controllers\Api\V1\UbicacionController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

/**
 * Rutas de autenticación para canales privados de WebSockets (Reverb)
 */
Broadcast::routes(['middleware' => ['auth:sanctum']]);
require __DIR__.'/channels.php';

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
     * Rutas de Landing (públicas)
     */
    Route::get('/landing/categories', [LandingController::class, 'index']);
    Route::get('/landing/navbar-data', [LandingController::class, 'navbarData']);
    Route::get('/landing/quote-data', [LandingController::class, 'quoteData']);
    Route::get('/landing/brands', [LandingController::class, 'brands']);
    Route::post('/landing/submit-quote', [LandingController::class, 'submitQuote'])->middleware('auth:sanctum');
    Route::post('/landing/contact', [LandingController::class, 'submitContactForm']);

    /**
     * Rutas de Ubicaciones (públicas para formularios)
     */
    Route::prefix('ubicaciones')->group(function () {
        Route::get('paises', [UbicacionController::class, 'countries']);
        Route::get('departamentos', [UbicacionController::class, 'states']);
        Route::get('ciudades', [UbicacionController::class, 'cities']);
    });

    /**
     * Rutas de Autenticación para Clientes (Landing)
     */
    Route::prefix('landing/auth')->group(function () {
        Route::post('/register', [ClientAuthController::class, 'register']);
        Route::post('/login', [ClientAuthController::class, 'login']);
        Route::get('/{provider}/redirect', [ClientAuthController::class, 'redirectToProvider']);
        Route::get('/{provider}/callback', [ClientAuthController::class, 'handleProviderCallback']);
    });

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
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/tokens', [AuthController::class, 'tokens']);
        Route::delete('/tokens/{tokenId}', [AuthController::class, 'revokeToken']);

        // Global Search
        Route::get('/search', [App\Http\Controllers\Api\V1\SearchController::class, 'index']);

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
        Route::post('pedidos/{pedido}/enviar-a-costeo', [PedidoController::class, 'enviarACosteo'])->name('pedidos.enviar-a-costeo');
        Route::post('pedidos/{pedido}/enviar-a-analisis', [PedidoController::class, 'enviarAAnalisis'])->name('pedidos.enviar-a-analisis');
        
        // Transiciones de estado
        Route::post('pedidos/{pedido}/publicar', [PedidoController::class, 'publicar'])->name('pedidos.publicar');
        Route::post('pedidos/{pedido}/cotizar', [PedidoController::class, 'cotizar'])->name('pedidos.cotizar');
        Route::post('pedidos/{pedido}/responder', [PedidoController::class, 'responder'])->name('pedidos.responder');
        Route::post('pedidos/{pedido}/enviar', [PedidoController::class, 'enviar'])->name('pedidos.enviar');
        Route::post('pedidos/{pedido}/entregar', [PedidoController::class, 'entregar'])->name('pedidos.entregar');
        Route::post('pedidos/{pedido}/cancelar', [PedidoController::class, 'cancelar'])->name('pedidos.cancelar');
        Route::post('pedidos/{pedido}/devolver-vendedor', [PedidoController::class, 'devolverAVendedor'])->name('pedidos.devolver-vendedor');
        Route::post('pedidos/{pedido}/devolver-analista', [PedidoController::class, 'devolverAAnalista'])->name('pedidos.devolver-analista');
        Route::post('pedidos/{pedido}/guardar-costeo', [PedidoController::class, 'guardarCosteo'])->name('pedidos.guardar-costeo');
        
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
        Route::post('cotizaciones/finalizar-costeo', [CotizacionController::class, 'finalizarCosteo'])->name('cotizaciones.finalizar-costeo');
        Route::get('cotizaciones/{cotizacion}/download-pdf', [CotizacionController::class, 'downloadPDF'])->name('cotizaciones.download-pdf');
        Route::post('cotizaciones/{cotizacion}/approve', [CotizacionController::class, 'approve'])->name('cotizaciones.approve');
        Route::post('cotizaciones/{cotizacion}/reject', [CotizacionController::class, 'reject'])->name('cotizaciones.reject');
        Route::apiResource('cotizaciones', CotizacionController::class);
        Route::apiResource('ordenes-compra', OrdenCompraController::class);
        Route::get('ordenes-compra/{ordenes_compra}/download-pdf', [OrdenCompraController::class, 'downloadPDF'])->name('ordenes-compra.download-pdf');
        Route::apiResource('ordenes-trabajo', OrdenTrabajoController::class);

        /**
         * Catálogos y referencias
         */
        Route::apiResource('articulos', ArticuloController::class);
        Route::prefix('articulos/{articulo}')->group(function () {
            // Referencias Cruzadas
            Route::post('referencias', [ArticuloController::class, 'addReferencia']);
            Route::delete('referencias/{referencia}', [ArticuloController::class, 'removeReferencia']);

            // Juegos (Kits)
            Route::post('juegos', [ArticuloController::class, 'addJuego']);
            Route::delete('juegos/{referencia}', [ArticuloController::class, 'removeJuego']);

            // Medidas
            Route::post('medidas', [ArticuloController::class, 'addMedida']);
            Route::put('medidas/{medida}', [ArticuloController::class, 'updateMedida']);
            Route::delete('medidas/{medida}', [ArticuloController::class, 'removeMedida']);
        });

        Route::post('referencias/bulk-search', [ReferenciaController::class, 'bulkSearch']);
        Route::post('referencias/bulk-search-or-create', [ReferenciaController::class, 'bulkSearchOrCreate']);
        Route::apiResource('referencias', ReferenciaController::class);
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
        Route::get('trms/latest', [TRMController::class, 'latest'])->name('trms.latest');
        Route::apiResource('trms', TRMController::class);

        /**
         * Gestión de Landing (Admin)
         */
        Route::prefix('landing')->group(function () {
            Route::get('contact-leads', [LandingController::class, 'contactLeads']);
            Route::put('contact-leads/{id}/status', [LandingController::class, 'updateContactLeadStatus']);
            Route::get('categorias', [LandingController::class, 'adminIndex']);
            Route::get('machine-types', [LandingController::class, 'machineTypesAdmin']);
            Route::post('categorias', [LandingController::class, 'storeCategoria']);
            Route::put('categorias/{categoria}', [LandingController::class, 'updateCategoria']);
            Route::delete('categorias/{categoria}', [LandingController::class, 'destroyCategoria']);
            Route::post('subcategorias', [LandingController::class, 'storeSubcategoria']);
            Route::put('subcategorias/{subcategoria}', [LandingController::class, 'updateSubcategoria']);
            Route::delete('subcategorias/{subcategoria}', [LandingController::class, 'destroySubcategoria']);
        });

        /**
         * Gestión de Dashboard
         */
        Route::prefix('dashboard')->group(function () {
            Route::get('stats', [DashboardController::class, 'stats']);
            Route::get('revenue-stream', [DashboardController::class, 'revenueStream']);
            Route::get('best-selling', [DashboardController::class, 'bestSelling']);
            Route::get('notifications', [DashboardController::class, 'notifications']);
        });

        /**
         * Gestión de Notificaciones
         */
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
            Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

        /**
         * Gestión de usuarios (solo admin)
         */
        Route::apiResource('users', UserController::class)
            ->middleware('role:super_admin|Administrador');
    });
});
