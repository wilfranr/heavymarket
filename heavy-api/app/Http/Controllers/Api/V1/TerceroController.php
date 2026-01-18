<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{StoreTerceroRequest, UpdateTerceroRequest};
use App\Http\Resources\TerceroResource;
use App\Models\Tercero;
use Illuminate\Http\{JsonResponse, Request};

/**
 * Controlador API para gestión de Terceros
 * 
 * Maneja operaciones CRUD para clientes y proveedores.
 */
class TerceroController extends Controller
{
    /**
     * Listar todos los terceros con filtros
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tercero::query();

        // Filtro por tipo de tercero
        if ($request->filled('tipo_tercero')) {
            $query->where('tipo_tercero', $request->input('tipo_tercero'));
        }

        // Filtro por clientes
        if ($request->filled('es_cliente')) {
            $query->where('es_cliente', (bool) $request->input('es_cliente'));
        }

        // Filtro por proveedores
        if ($request->filled('es_proveedor')) {
            $query->where('es_proveedor', (bool) $request->input('es_proveedor'));
        }

        // Búsqueda por nombre o documento
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                    ->orWhere('nombre_comercial', 'like', "%{$search}%")
                    ->orWhere('documento', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'razon_social');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $terceros = $query->paginate($perPage);

        return response()->json([
            'data' => TerceroResource::collection($terceros),
            'meta' => [
                'current_page' => $terceros->currentPage(),
                'last_page' => $terceros->lastPage(),
                'per_page' => $terceros->perPage(),
                'total' => $terceros->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo tercero
     * 
     * @param StoreTerceroRequest $request
     * @return JsonResponse
     */
    public function store(StoreTerceroRequest $request): JsonResponse
    {
        try {
            $tercero = Tercero::create($request->validated());

            return response()->json([
                'data' => new TerceroResource($tercero),
                'message' => 'Tercero creado exitosamente',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el tercero',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un tercero específico
     * 
     * @param Tercero $tercero
     * @return JsonResponse
     */
    public function show(Tercero $tercero): JsonResponse
    {
        $tercero->load(['contactos', 'direcciones', 'fabricantes', 'sistemas']);

        return response()->json([
            'data' => new TerceroResource($tercero),
        ]);
    }

    /**
     * Actualizar un tercero existente
     * 
     * @param UpdateTerceroRequest $request
     * @param Tercero $tercero
     * @return JsonResponse
     */
    public function update(UpdateTerceroRequest $request, Tercero $tercero): JsonResponse
    {
        try {
            $tercero->update($request->validated());

            return response()->json([
                'data' => new TerceroResource($tercero),
                'message' => 'Tercero actualizado exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el tercero',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un tercero
     * 
     * @param Tercero $tercero
     * @return JsonResponse
     */
    public function destroy(Tercero $tercero): JsonResponse
    {
        try {
            $tercero->delete();

            return response()->json([
                'message' => 'Tercero eliminado exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el tercero',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
