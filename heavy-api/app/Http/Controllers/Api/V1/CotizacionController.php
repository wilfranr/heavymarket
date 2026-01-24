<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CotizacionResource;
use App\Models\Cotizacion;
use App\Services\CotizacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Cotizaciones
 *
 * Maneja todas las operaciones CRUD de cotizaciones y
 * operaciones especiales como aprobar, rechazar y cálculos.
 */
class CotizacionController extends Controller
{
    public function __construct(
        private readonly CotizacionService $cotizacionService,
    ) {}

    /**
     * Listar todas las cotizaciones con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cotizacion::query()
            ->with(['pedido', 'tercero', 'user']);

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        // Filtro por tercero
        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        // Filtro por pedido
        if ($request->filled('pedido_id')) {
            $query->where('pedido_id', $request->input('pedido_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $cotizaciones = $query->paginate($perPage);

        return response()->json([
            'data' => CotizacionResource::collection($cotizaciones->items()),
            'meta' => [
                'current_page' => $cotizaciones->currentPage(),
                'last_page' => $cotizaciones->lastPage(),
                'per_page' => $cotizaciones->perPage(),
                'total' => $cotizaciones->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva cotización
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'pedido_id' => ['required', 'integer', 'exists:pedidos,id'],
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
        ]);

        try {
            $pedido = \App\Models\Pedido::findOrFail($request->input('pedido_id'));

            $cotizacion = $this->cotizacionService->crearDesdePedido(
                $pedido,
                ['user_id' => $request->user()->id]
            );

            return response()->json([
                'data' => $cotizacion,
                'message' => 'Cotización creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una cotización específica
     */
    public function show(Cotizacion $cotizacion): JsonResponse
    {
        $cotizacion->load([
            'pedido',
            'pedido.referencias',
            'pedido.referencias.proveedores',
            'tercero',
            'user',
            'referenciasProveedores',
            'referenciasProveedores.pedidoReferenciaProveedor',
        ]);

        // Calcular totales si no están calculados
        if (! $cotizacion->total) {
            $total = $this->cotizacionService->calcularPrecioTotal($cotizacion);
            $cotizacion->update(['total' => $total]);
        }

        $impuestos = $this->cotizacionService->calcularConImpuestos($cotizacion->total ?? 0);

        return response()->json([
            'data' => new CotizacionResource($cotizacion),
            'totales' => $impuestos,
        ]);
    }

    /**
     * Actualizar una cotización
     */
    public function update(Request $request, Cotizacion $cotizacion): JsonResponse
    {
        $validated = $request->validate([
            'estado' => [
                'sometimes',
                'string',
                \Illuminate\Validation\Rule::in(['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida', 'En_Proceso']),
            ],
            'fecha_vencimiento' => ['sometimes', 'date', 'after:today'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $cotizacion->update($validated);
            $cotizacion->load(['pedido', 'tercero', 'user', 'referenciasProveedores']);

            return response()->json([
                'data' => new CotizacionResource($cotizacion),
                'message' => 'Cotización actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una cotización
     */
    public function destroy(Cotizacion $cotizacion): JsonResponse
    {
        try {
            $cotizacion->delete();

            return response()->json([
                'message' => 'Cotización eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
