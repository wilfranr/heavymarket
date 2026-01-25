<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTRMRequest;
use App\Http\Resources\TRMResource;
use App\Models\TRM;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de TRM
 */
class TRMController extends Controller
{
    /**
     * Listar todas las TRM
     */
    public function index(Request $request): JsonResponse
    {
        $query = TRM::query();

        // Ordenamiento (más reciente primero por defecto)
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $trms = $query->paginate($perPage);

        return response()->json([
            'data' => TRMResource::collection($trms->items()),
            'meta' => [
                'current_page' => $trms->currentPage(),
                'last_page' => $trms->lastPage(),
                'per_page' => $trms->perPage(),
                'total' => $trms->total(),
            ],
        ]);
    }

    /**
     * Obtener la TRM más reciente
     */
    public function latest(): JsonResponse
    {
        $trm = TRM::latest('created_at')->first();

        if (!$trm) {
            return response()->json([
                'message' => 'No se encontró ninguna TRM',
            ], 404);
        }

        return response()->json([
            'data' => new TRMResource($trm),
        ]);
    }

    /**
     * Crear una nueva TRM
     */
    public function store(StoreTRMRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $trm = TRM::create($validated);

            DB::commit();

            return response()->json([
                'data' => new TRMResource($trm),
                'message' => 'TRM creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la TRM',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una TRM específica
     */
    public function show(TRM $trm): JsonResponse
    {
        return response()->json([
            'data' => new TRMResource($trm),
        ]);
    }

    /**
     * Actualizar una TRM
     */
    public function update(Request $request, TRM $trm): JsonResponse
    {
        $validated = $request->validate([
            'trm' => ['sometimes', 'numeric', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $trm->update($validated);

            DB::commit();

            return response()->json([
                'data' => new TRMResource($trm),
                'message' => 'TRM actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar la TRM',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una TRM
     */
    public function destroy(TRM $trm): JsonResponse
    {
        try {
            $trm->delete();

            return response()->json([
                'message' => 'TRM eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la TRM',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
