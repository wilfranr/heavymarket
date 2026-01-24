<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFabricanteRequest;
use App\Http\Requests\UpdateFabricanteRequest;
use App\Http\Resources\FabricanteResource;
use App\Models\Fabricante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Fabricantes
 *
 * Maneja todas las operaciones CRUD de fabricantes a través del API REST.
 */
class FabricanteController extends Controller
{
    /**
     * Listar todos los fabricantes con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en nombre o descripción. Example: Caterpillar
     */
    public function index(Request $request): JsonResponse
    {
        $query = Fabricante::query();

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
        $fabricantes = $query->paginate($perPage);

        return response()->json([
            'data' => FabricanteResource::collection($fabricantes),
            'meta' => [
                'current_page' => $fabricantes->currentPage(),
                'last_page' => $fabricantes->lastPage(),
                'per_page' => $fabricantes->perPage(),
                'total' => $fabricantes->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo fabricante
     */
    public function store(StoreFabricanteRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['nombre'] = ucwords($data['nombre']);

        $fabricante = Fabricante::create($data);

        return response()->json([
            'message' => 'Fabricante creado exitosamente',
            'data' => new FabricanteResource($fabricante),
        ], 201);
    }

    /**
     * Mostrar un fabricante específico
     */
    public function show(Fabricante $fabricante): JsonResponse
    {
        return response()->json([
            'data' => new FabricanteResource($fabricante),
        ]);
    }

    /**
     * Actualizar un fabricante existente
     */
    public function update(UpdateFabricanteRequest $request, Fabricante $fabricante): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['nombre'])) {
            $data['nombre'] = ucwords($data['nombre']);
        }

        $fabricante->update($data);

        return response()->json([
            'message' => 'Fabricante actualizado exitosamente',
            'data' => new FabricanteResource($fabricante->fresh()),
        ]);
    }

    /**
     * Eliminar un fabricante
     */
    public function destroy(Fabricante $fabricante): JsonResponse
    {
        $fabricante->delete();

        return response()->json([
            'message' => 'Fabricante eliminado exitosamente',
        ]);
    }
}
