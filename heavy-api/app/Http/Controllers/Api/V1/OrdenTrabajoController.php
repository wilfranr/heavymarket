<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdenTrabajoRequest;
use App\Http\Resources\OrdenTrabajoResource;
use App\Models\OrdenTrabajo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Controlador API para gestión de Órdenes de Trabajo
 */
class OrdenTrabajoController extends Controller
{
    /**
     * Listar todas las órdenes de trabajo
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrdenTrabajo::query()
            ->with(['tercero', 'pedido', 'cotizacion', 'transportadora', 'direccion', 'user', 'referencias.pedidoReferencia']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        if ($request->filled('pedido_id')) {
            $query->where('pedido_id', $request->input('pedido_id'));
        }

        if ($request->filled('transportadora_id')) {
            $query->where('transportadora_id', $request->input('transportadora_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $ordenes = $query->paginate($perPage);

        return response()->json([
            'data' => OrdenTrabajoResource::collection($ordenes->items()),
            'meta' => [
                'current_page' => $ordenes->currentPage(),
                'last_page' => $ordenes->lastPage(),
                'per_page' => $ordenes->perPage(),
                'total' => $ordenes->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva orden de trabajo
     */
    public function store(StoreOrdenTrabajoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $ordenTrabajo = OrdenTrabajo::create([
                'user_id' => $request->user()->id,
                'tercero_id' => $validated['tercero_id'] ?? null,
                'pedido_id' => $validated['pedido_id'] ?? null,
                'cotizacion_id' => $validated['cotizacion_id'] ?? null,
                'estado' => $validated['estado'] ?? 'Pendiente',
                'fecha_ingreso' => $validated['fecha_ingreso'],
                'fecha_entrega' => $validated['fecha_entrega'] ?? null,
                'direccion_id' => $validated['direccion_id'] ?? null,
                'telefono' => $validated['telefono'],
                'observaciones' => $validated['observaciones'] ?? null,
                'guia' => $validated['guia'] ?? null,
                'transportadora_id' => $validated['transportadora_id'] ?? null,
                'archivo' => $validated['archivo'] ?? null,
                'motivo_cancelacion' => $validated['motivo_cancelacion'] ?? null,
            ]);

            DB::commit();

            $ordenTrabajo->load([
                'tercero',
                'pedido',
                'cotizacion',
                'transportadora',
                'direccion',
                'user',
                'referencias',
            ]);

            return response()->json([
                'data' => new OrdenTrabajoResource($ordenTrabajo),
                'message' => 'Orden de trabajo creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una orden de trabajo específica
     */
    public function show(OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        $ordenTrabajo->load([
            'tercero',
            'pedido',
            'cotizacion',
            'transportadora',
            'direccion',
            'user',
            'referencias.pedidoReferencia',
            'referencias.referencia',
        ]);

        return response()->json([
            'data' => new OrdenTrabajoResource($ordenTrabajo),
        ]);
    }

    /**
     * Actualizar una orden de trabajo
     */
    public function update(Request $request, OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        $validated = $request->validate([
            'estado' => [
                'sometimes',
                'string',
                Rule::in(['Pendiente', 'En Proceso', 'Completado', 'Cancelado']),
            ],
            'fecha_ingreso' => ['sometimes', 'date'],
            'fecha_entrega' => ['sometimes', 'date', 'after_or_equal:fecha_ingreso'],
            'direccion_id' => ['nullable', 'integer', 'exists:direcciones,id'],
            'telefono' => ['sometimes', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'guia' => ['nullable', 'string', 'max:255'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'archivo' => ['nullable', 'string', 'max:255'],
            'motivo_cancelacion' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $ordenTrabajo->update($validated);
            $ordenTrabajo->load([
                'tercero',
                'pedido',
                'cotizacion',
                'transportadora',
                'direccion',
                'user',
                'referencias',
            ]);

            return response()->json([
                'data' => new OrdenTrabajoResource($ordenTrabajo),
                'message' => 'Orden de trabajo actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una orden de trabajo
     */
    public function destroy(OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        try {
            $ordenTrabajo->delete();

            return response()->json([
                'message' => 'Orden de trabajo eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
