<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoriaRequest;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Categorías
 */
class CategoriaController extends Controller
{
    /**
     * Listar todas las categorías
     */
    public function index(Request $request): JsonResponse
    {
        $query = Categoria::query()
            ->with(['terceros', 'referencias']);

        // Búsqueda
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nombre', 'like', "%{$search}%");
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $categorias = $query->paginate($perPage);

        return response()->json([
            'data' => CategoriaResource::collection($categorias->items()),
            'meta' => [
                'current_page' => $categorias->currentPage(),
                'last_page' => $categorias->lastPage(),
                'per_page' => $categorias->perPage(),
                'total' => $categorias->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva categoría
     */
    public function store(StoreCategoriaRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $categoria = Categoria::create([
                'nombre' => $validated['nombre'],
            ]);

            // Sincronizar terceros si se proporcionaron
            if (isset($validated['terceros']) && is_array($validated['terceros'])) {
                $categoria->terceros()->sync($validated['terceros']);
            }

            DB::commit();

            $categoria->load(['terceros', 'referencias']);

            return response()->json([
                'data' => new CategoriaResource($categoria),
                'message' => 'Categoría creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una categoría específica
     */
    public function show(Categoria $categoria): JsonResponse
    {
        $categoria->load(['terceros', 'referencias']);

        return response()->json([
            'data' => new CategoriaResource($categoria),
        ]);
    }

    /**
     * Actualizar una categoría
     */
    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255', 'unique:categorias,nombre,'.$categoria->id],
            'terceros' => ['nullable', 'array'],
            'terceros.*' => ['integer', 'exists:terceros,id'],
        ]);

        try {
            $categoria->update([
                'nombre' => $validated['nombre'] ?? $categoria->nombre,
            ]);

            // Sincronizar terceros si se proporcionaron
            if (isset($validated['terceros'])) {
                $categoria->terceros()->sync($validated['terceros']);
            }

            $categoria->load(['terceros', 'referencias']);

            return response()->json([
                'data' => new CategoriaResource($categoria),
                'message' => 'Categoría actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una categoría
     */
    public function destroy(Categoria $categoria): JsonResponse
    {
        try {
            $categoria->delete();

            return response()->json([
                'message' => 'Categoría eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
