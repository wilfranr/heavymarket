<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferenciaRequest;
use App\Http\Requests\UpdateReferenciaRequest;
use App\Http\Resources\ReferenciaResource;
use App\Models\Referencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Referencias
 *
 * Maneja todas las operaciones CRUD de referencias a través del API REST.
 */
class ReferenciaController extends Controller
{
    /**
     * Listar todas las referencias con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en referencia o comentario. Example: REF123
     * @queryParam marca_id int Filtrar por marca. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        $query = Referencia::query()->with(['marca']);

        // Búsqueda en referencia o comentario
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('referencia', 'like', "%{$search}%")
                    ->orWhere('comentario', 'like', "%{$search}%");
            });
        }

        // Filtro por marca
        if ($request->filled('marca_id')) {
            $query->where('marca_id', $request->input('marca_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'referencia');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $referencias = $query->paginate($perPage);

        return response()->json([
            'data' => ReferenciaResource::collection($referencias),
            'meta' => [
                'current_page' => $referencias->currentPage(),
                'last_page' => $referencias->lastPage(),
                'per_page' => $referencias->perPage(),
                'total' => $referencias->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva referencia
     */
    public function store(StoreReferenciaRequest $request): JsonResponse
    {
        $referencia = Referencia::create($request->validated());

        return response()->json([
            'message' => 'Referencia creada exitosamente',
            'data' => new ReferenciaResource($referencia->load('marca')),
        ], 201);
    }

    /**
     * Mostrar una referencia específica
     */
    public function show(Referencia $referencia): JsonResponse
    {
        $referencia->load(['marca', 'articulos', 'categoria']);

        return response()->json([
            'data' => new ReferenciaResource($referencia),
        ]);
    }

    /**
     * Actualizar una referencia existente
     */
    public function update(UpdateReferenciaRequest $request, Referencia $referencia): JsonResponse
    {
        $referencia->update($request->validated());

        return response()->json([
            'message' => 'Referencia actualizada exitosamente',
            'data' => new ReferenciaResource($referencia->fresh()->load('marca')),
        ]);
    }

    /**
     * Eliminar una referencia
     */
    public function destroy(Referencia $referencia): JsonResponse
    {
        $referencia->delete();

        return response()->json([
            'message' => 'Referencia eliminada exitosamente',
        ]);
    }
}
