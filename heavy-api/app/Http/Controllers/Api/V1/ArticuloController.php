<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticuloRequest;
use App\Http\Requests\UpdateArticuloRequest;
use App\Http\Resources\ArticuloResource;
use App\Models\Articulo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Artículos
 *
 * Maneja todas las operaciones CRUD de artículos a través del API REST.
 */
class ArticuloController extends Controller
{
    /**
     * Listar todos los artículos con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en definición o descripción específica. Example: Pistón
     */
    public function index(Request $request): JsonResponse
    {
        $query = Articulo::query()->with(['referencias']);

        // Búsqueda en definición o descripción específica
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('definicion', 'like', "%{$search}%")
                    ->orWhere('descripcionEspecifica', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'descripcionEspecifica');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $articulos = $query->paginate($perPage);

        return response()->json([
            'data' => ArticuloResource::collection($articulos),
            'meta' => [
                'current_page' => $articulos->currentPage(),
                'last_page' => $articulos->lastPage(),
                'per_page' => $articulos->perPage(),
                'total' => $articulos->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo artículo
     */
    public function store(StoreArticuloRequest $request): JsonResponse
    {
        $articulo = Articulo::create($request->validated());

        return response()->json([
            'message' => 'Artículo creado exitosamente',
            'data' => new ArticuloResource($articulo->load('referencias')),
        ], 201);
    }

    /**
     * Mostrar un artículo específico
     */
    public function show(Articulo $articulo): JsonResponse
    {
        $articulo->load(['referencias', 'medidas']);

        return response()->json([
            'data' => new ArticuloResource($articulo),
        ]);
    }

    /**
     * Actualizar un artículo existente
     */
    public function update(UpdateArticuloRequest $request, Articulo $articulo): JsonResponse
    {
        $articulo->update($request->validated());

        return response()->json([
            'message' => 'Artículo actualizado exitosamente',
            'data' => new ArticuloResource($articulo->fresh()->load('referencias')),
        ]);
    }

    /**
     * Eliminar un artículo
     */
    public function destroy(Articulo $articulo): JsonResponse
    {
        $articulo->delete();

        return response()->json([
            'message' => 'Artículo eliminado exitosamente',
        ]);
    }
}
