<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaquinaRequest;
use App\Http\Requests\UpdateMaquinaRequest;
use App\Http\Resources\MaquinaResource;
use App\Models\Maquina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Máquinas
 *
 * Maneja todas las operaciones CRUD de máquinas a través del API REST.
 */
class MaquinaController extends Controller
{
    /**
     * Listar todas las máquinas con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en modelo, serie o arreglo. Example: CAT
     * @queryParam fabricante_id int Filtrar por fabricante. Example: 1
     * @queryParam tipo int Filtrar por tipo de máquina. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        $query = Maquina::query()->with(['fabricantes', 'listas']);

        // Búsqueda en modelo, serie o arreglo
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('modelo', 'like', "%{$search}%")
                    ->orWhere('serie', 'like', "%{$search}%")
                    ->orWhere('arreglo', 'like', "%{$search}%");
            });
        }

        // Filtro por fabricante
        if ($request->filled('fabricante_id')) {
            $query->where('fabricante_id', $request->input('fabricante_id'));
        }

        // Filtro por tipo
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'modelo');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $maquinas = $query->paginate($perPage);

        return response()->json([
            'data' => MaquinaResource::collection($maquinas),
            'meta' => [
                'current_page' => $maquinas->currentPage(),
                'last_page' => $maquinas->lastPage(),
                'per_page' => $maquinas->perPage(),
                'total' => $maquinas->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva máquina
     */
    public function store(StoreMaquinaRequest $request): JsonResponse
    {
        $maquina = Maquina::create($request->validated());

        return response()->json([
            'message' => 'Máquina creada exitosamente',
            'data' => new MaquinaResource($maquina->load(['fabricantes', 'listas'])),
        ], 201);
    }

    /**
     * Mostrar una máquina específica
     */
    public function show(Maquina $maquina): JsonResponse
    {
        $maquina->load(['fabricantes', 'listas']);

        return response()->json([
            'data' => new MaquinaResource($maquina),
        ]);
    }

    /**
     * Actualizar una máquina existente
     */
    public function update(UpdateMaquinaRequest $request, Maquina $maquina): JsonResponse
    {
        $maquina->update($request->validated());

        return response()->json([
            'message' => 'Máquina actualizada exitosamente',
            'data' => new MaquinaResource($maquina->fresh()->load(['fabricantes', 'listas'])),
        ]);
    }

    /**
     * Eliminar una máquina
     */
    public function destroy(Maquina $maquina): JsonResponse
    {
        $maquina->delete();

        return response()->json([
            'message' => 'Máquina eliminada exitosamente',
        ]);
    }
}
