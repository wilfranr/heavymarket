<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrdenTrabajo;
use Illuminate\Http\{JsonResponse, Request};

/**
 * Controlador API para gestión de Órdenes de Trabajo
 */
class OrdenTrabajoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OrdenTrabajo::query()->with(['user', 'referencias']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        $ordenes = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $ordenes->items(),
            'meta' => [
                'current_page' => $ordenes->currentPage(),
                'last_page' => $ordenes->lastPage(),
                'total' => $ordenes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descripcion' => ['required', 'string'],
            'estado' => ['nullable', 'string'],
        ]);

        $ordenTrabajo = OrdenTrabajo::create(array_merge(
            $validated,
            ['user_id' => $request->user()->id]
        ));

        return response()->json([
            'data' => $ordenTrabajo,
            'message' => 'Orden de trabajo creada exitosamente',
        ], 201);
    }

    public function show(OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        return response()->json([
            'data' => $ordenTrabajo->load(['user', 'referencias']),
        ]);
    }

    public function update(Request $request, OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        $validated = $request->validate([
            'descripcion' => ['sometimes', 'string'],
            'estado' => ['sometimes', 'string'],
        ]);

        $ordenTrabajo->update($validated);

        return response()->json([
            'data' => $ordenTrabajo,
            'message' => 'Orden de trabajo actualizada exitosamente',
        ]);
    }

    public function destroy(OrdenTrabajo $ordenTrabajo): JsonResponse
    {
        $ordenTrabajo->delete();

        return response()->json([
            'message' => 'Orden de trabajo eliminada exitosamente',
        ], 204);
    }
}
