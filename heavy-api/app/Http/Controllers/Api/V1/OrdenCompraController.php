<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrdenCompra;
use Illuminate\Http\{JsonResponse, Request};
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
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'proveedor_id' => ['required', 'integer', 'exists:terceros,id'],
            'estado' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'referencias' => ['nullable', 'array'],
        ]);

        try {
            DB::beginTransaction();

            $ordenCompra = OrdenCompra::create([
                'proveedor_id' => $validated['proveedor_id'],
                'user_id' => $request->user()->id,
                'estado' => $validated['estado'] ?? 'Pendiente',
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'data' => $ordenCompra->load('proveedor'),
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
        $ordenCompra->load(['proveedor', 'user', 'referencias.referencia']);

        return response()->json([
            'data' => $ordenCompra,
        ]);
    }

    /**
     * Actualizar una orden de compra
     */
    public function update(Request $request, OrdenCompra $ordenCompra): JsonResponse
    {
        $validated = $request->validate([
            'estado' => ['sometimes', 'string'],
            'observaciones' => ['nullable', 'string'],
        ]);

        try {
            $ordenCompra->update($validated);

            return response()->json([
                'data' => $ordenCompra,
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
