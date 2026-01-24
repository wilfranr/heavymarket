<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSistemaRequest;
use App\Http\Requests\UpdateSistemaRequest;
use App\Http\Resources\SistemaResource;
use App\Models\Sistema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Sistemas
 *
 * Maneja todas las operaciones CRUD de sistemas a través del API REST.
 */
class SistemaController extends Controller
{
    /**
     * Listar todos los sistemas con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en nombre o descripción. Example: Hidráulico
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sistema::query();

        // Búsqueda en nombre o descripción
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $sistemas = $query->paginate($perPage);

        return response()->json([
            'data' => SistemaResource::collection($sistemas),
            'meta' => [
                'current_page' => $sistemas->currentPage(),
                'last_page' => $sistemas->lastPage(),
                'per_page' => $sistemas->perPage(),
                'total' => $sistemas->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo sistema
     */
    public function store(StoreSistemaRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['descripcion'])) {
            $data['descripcion'] = ucwords($data['descripcion']);
        }

        $sistema = Sistema::create($data);

        return response()->json([
            'message' => 'Sistema creado exitosamente',
            'data' => new SistemaResource($sistema),
        ], 201);
    }

    /**
     * Mostrar un sistema específico
     */
    public function show(Sistema $sistema): JsonResponse
    {
        return response()->json([
            'data' => new SistemaResource($sistema),
        ]);
    }

    /**
     * Actualizar un sistema existente
     */
    public function update(UpdateSistemaRequest $request, Sistema $sistema): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['descripcion'])) {
            $data['descripcion'] = ucwords($data['descripcion']);
        }

        $sistema->update($data);

        return response()->json([
            'message' => 'Sistema actualizado exitosamente',
            'data' => new SistemaResource($sistema->fresh()),
        ]);
    }

    /**
     * Eliminar un sistema (soft delete)
     */
    public function destroy(Sistema $sistema): JsonResponse
    {
        $sistema->delete();

        return response()->json([
            'message' => 'Sistema eliminado exitosamente',
        ]);
    }
}
