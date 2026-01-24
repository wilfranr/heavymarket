<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdenCompraRequest;
use App\Http\Resources\OrdenCompraResource;
use App\Models\OrdenCompra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Órdenes de Compra
 */
class OrdenCompraController extends Controller
{
    /**
     * Listar todas las órdenes de compra
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrdenCompra::query()
            ->with(['proveedor', 'user', 'referencias']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('proveedor_id')) {
            $query->where('proveedor_id', $request->input('proveedor_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $ordenes = $query->paginate($perPage);

        return response()->json([
            'data' => $ordenes->items(),
            'meta' => [
                'current_page' => $ordenes->currentPage(),
                'last_page' => $ordenes->lastPage(),
                'per_page' => $ordenes->perPage(),
                'total' => $ordenes->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva orden de compra
     */
    public function store(StoreOrdenCompraRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $ordenCompra = OrdenCompra::create([
                'user_id' => $request->user()->id,
                'proveedor_id' => $validated['proveedor_id'],
                'tercero_id' => $validated['tercero_id'] ?? null,
                'pedido_id' => $validated['pedido_id'] ?? null,
                'cotizacion_id' => $validated['cotizacion_id'] ?? null,
                'fecha_expedicion' => $validated['fecha_expedicion'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'] ?? 'Pendiente',
                'color' => $validated['color'] ?? '#FFFF00',
                'observaciones' => $validated['observaciones'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
                'telefono' => $validated['telefono'] ?? null,
                'guia' => $validated['guia'] ?? null,
            ]);

            // Agregar referencias si existen
            if (isset($validated['referencias']) && is_array($validated['referencias'])) {
                foreach ($validated['referencias'] as $referencia) {
                    $ordenCompra->addReferencia(
                        $referencia['referencia_id'],
                        $referencia['cantidad'],
                        $referencia['valor_unitario'],
                        $referencia['valor_total']
                    );
                }
            }

            // Calcular totales
            $valorTotal = $ordenCompra->getTotalReferencias();
            $ordenCompra->update(['valor_total' => $valorTotal]);

            DB::commit();

            $ordenCompra->load(['proveedor', 'tercero', 'pedido', 'user', 'referencias.referencia']);

            return response()->json([
                'data' => new OrdenCompraResource($ordenCompra),
                'message' => 'Orden de compra creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una orden de compra específica
     */
    public function show(OrdenCompra $ordenCompra): JsonResponse
    {
        $ordenCompra->load([
            'proveedor',
            'tercero',
            'pedido',
            'cotizacion',
            'user',
            'referencias.referencia',
            'pedidoReferencia',
        ]);

        return response()->json([
            'data' => new OrdenCompraResource($ordenCompra),
        ]);
    }

    /**
     * Actualizar una orden de compra
     */
    public function update(Request $request, OrdenCompra $ordenCompra): JsonResponse
    {
        $validated = $request->validate([
            'estado' => [
                'sometimes',
                'string',
                \Illuminate\Validation\Rule::in(['Pendiente', 'En proceso', 'Entregado', 'Cancelado']),
            ],
            'color' => [
                'sometimes',
                'string',
                \Illuminate\Validation\Rule::in(['#FFFF00', '#00ff00', '#ff0000']),
            ],
            'fecha_expedicion' => ['sometimes', 'date'],
            'fecha_entrega' => ['sometimes', 'date', 'after_or_equal:fecha_expedicion'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'guia' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $ordenCompra->update($validated);
            $ordenCompra->load(['proveedor', 'tercero', 'pedido', 'user', 'referencias.referencia']);

            return response()->json([
                'data' => new OrdenCompraResource($ordenCompra),
                'message' => 'Orden de compra actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una orden de compra
     */
    public function destroy(OrdenCompra $ordenCompra): JsonResponse
    {
        try {
            $ordenCompra->delete();

            return response()->json([
                'message' => 'Orden de compra eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
