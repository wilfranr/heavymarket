<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDireccionRequest;
use App\Http\Requests\UpdateDireccionRequest;
use App\Http\Resources\DireccionResource;
use App\Models\Direccion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Direcciones
 */
class DireccionController extends Controller
{
    /**
     * Listar todas las direcciones
     */
    public function index(Request $request): JsonResponse
    {
        $query = Direccion::query()
            ->with(['tercero', 'country', 'city', 'state', 'transportadora']);

        // Filtro por tercero
        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        // Búsqueda
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('direccion', 'like', "%{$search}%")
                    ->orWhere('destinatario', 'like', "%{$search}%")
                    ->orWhere('ciudad_texto', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'direccion');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $direcciones = $query->paginate($perPage);

        return response()->json([
            'data' => DireccionResource::collection($direcciones->items()),
            'meta' => [
                'current_page' => $direcciones->currentPage(),
                'last_page' => $direcciones->lastPage(),
                'per_page' => $direcciones->perPage(),
                'total' => $direcciones->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva dirección
     */
    public function store(StoreDireccionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $direccion = Direccion::create($validated);

            DB::commit();

            $direccion->load(['tercero', 'country', 'city', 'state', 'transportadora']);

            return response()->json([
                'data' => new DireccionResource($direccion),
                'message' => 'Dirección creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la dirección',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una dirección específica
     */
    public function show(Direccion $direccion): JsonResponse
    {
        $direccion->load(['tercero', 'country', 'city', 'state', 'transportadora']);

        return response()->json([
            'data' => new DireccionResource($direccion),
        ]);
    }

    /**
     * Actualizar una dirección
     */
    public function update(UpdateDireccionRequest $request, Direccion $direccion): JsonResponse
    {
        $validated = $request->validated();

        try {
            DB::beginTransaction();

            $direccion->update($validated);

            DB::commit();

            $direccion->load(['tercero', 'country', 'city', 'state', 'transportadora']);

            return response()->json([
                'data' => new DireccionResource($direccion),
                'message' => 'Dirección actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar la dirección',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una dirección
     */
    public function destroy(Direccion $direccion): JsonResponse
    {
        try {
            $direccion->delete();

            return response()->json([
                'message' => 'Dirección eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la dirección',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
