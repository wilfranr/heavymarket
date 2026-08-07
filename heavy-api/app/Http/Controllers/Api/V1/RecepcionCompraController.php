<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecepcionCompraImagenRequest;
use App\Http\Requests\StoreRecepcionCompraRequest;
use App\Http\Resources\RecepcionCompraImagenResource;
use App\Http\Resources\RecepcionCompraResource;
use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Services\RecepcionCompraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Controlador API para recepciones de compra registradas directamente
 * desde una Orden de Compra (sin exigir Orden de Trabajo).
 */
class RecepcionCompraController extends Controller
{
    private const ROLES_AUTORIZADOS = ['super_admin', 'Administrador', 'Logistica'];

    public function __construct(
        private readonly RecepcionCompraService $recepcionCompraService,
    ) {}

    /**
     * Registrar una recepción de compra para la Orden de Compra indicada.
     */
    public function store(StoreRecepcionCompraRequest $request, OrdenCompra $orden_compra): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(self::ROLES_AUTORIZADOS)
            && ! $user->roles()->whereIn('name', self::ROLES_AUTORIZADOS)->exists()) {
            abort(403, 'No está autorizado para registrar recepciones de compra.');
        }

        try {
            $recepcion = $this->recepcionCompraService->registrarDesdeOrdenCompra(
                $orden_compra,
                $request->validated(),
                $user
            );

            return response()->json([
                'data' => new RecepcionCompraResource($recepcion),
                'message' => 'Recepción de compra registrada exitosamente',
            ], 201);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            abort(500, 'Error al registrar la recepción de compra: '.$exception->getMessage());
        }
    }

    /**
     * Historial de entregas (recepciones) de una Orden de Compra.
     */
    public function index(OrdenCompra $orden_compra): JsonResponse
    {
        $recepciones = $orden_compra->recepcionesCompra()
            ->with([
                'detalles.ordenCompraDetalle.referencia',
                'recibidoPor',
                'anuladaPor',
                'imagenes',
            ])
            ->orderByDesc('fecha_recepcion')
            ->get();

        return response()->json([
            'data' => RecepcionCompraResource::collection($recepciones),
        ]);
    }

    /**
     * Adjuntar una foto o guía de transportadora a una recepción de compra.
     */
    public function storeImagen(StoreRecepcionCompraImagenRequest $request, RecepcionCompra $recepcion): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(self::ROLES_AUTORIZADOS)
            && ! $user->roles()->whereIn('name', self::ROLES_AUTORIZADOS)->exists()) {
            abort(403, 'No está autorizado para adjuntar imágenes de recepción.');
        }

        try {
            $imagen = $this->recepcionCompraService->storeImagen(
                $recepcion,
                $request->file('imagen'),
                (string) $request->validated('tipo'),
                $user,
            );

            return response()->json([
                'data' => new RecepcionCompraImagenResource($imagen),
                'message' => 'Imagen adjuntada exitosamente',
            ], 201);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            abort(500, 'Error al adjuntar la imagen: '.$exception->getMessage());
        }
    }
}
