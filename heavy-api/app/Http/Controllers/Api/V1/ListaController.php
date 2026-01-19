<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{StoreListaRequest, UpdateListaRequest};
use App\Http\Resources\ListaResource;
use App\Models\Lista;
use Illuminate\Http\{JsonResponse, Request};

/**
 * Controlador API para gestión de Listas
 * 
 * Maneja todas las operaciones CRUD de listas (catálogos) a través del API REST.
 * Las listas se usan para tipos de máquinas, marcas, unidades de medida, etc.
 */
class ListaController extends Controller
{
    /**
     * Listar todas las listas con filtros opcionales
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam tipo string Filtrar por tipo. Example: Marca
     * @queryParam search string Buscar en nombre o definición. Example: Caterpillar
     */
    public function index(Request $request): JsonResponse
    {
        $query = Lista::query();

        // Filtro por tipo
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        // Búsqueda en nombre o definición
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('definicion', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $listas = $query->paginate($perPage);

        return response()->json([
            'data' => ListaResource::collection($listas),
            'meta' => [
                'current_page' => $listas->currentPage(),
                'last_page' => $listas->lastPage(),
                'per_page' => $listas->perPage(),
                'total' => $listas->total(),
            ],
        ]);
    }

    /**
     * Obtener listas por tipo (sin paginación, para dropdowns)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getByTipo(Request $request): JsonResponse
    {
        $tipo = $request->input('tipo');
        
        if (!$tipo) {
            return response()->json([
                'message' => 'El parámetro tipo es requerido'
            ], 422);
        }

        $listas = Lista::where('tipo', $tipo)
            ->orderBy('nombre', 'asc')
            ->get();

        return response()->json([
            'data' => ListaResource::collection($listas)
        ]);
    }

    /**
     * Crear una nueva lista
     * 
     * @param StoreListaRequest $request
     * @return JsonResponse
     */
    public function store(StoreListaRequest $request): JsonResponse
    {
        $lista = Lista::create([
            'tipo' => $request->input('tipo'),
            'nombre' => ucwords($request->input('nombre')), // Asegurar primera letra mayúscula
            'definicion' => $request->input('definicion'),
            'foto' => $request->input('foto'),
            'fotoMedida' => $request->input('fotoMedida'),
            'sistema_id' => $request->input('sistema_id'),
        ]);

        return response()->json([
            'message' => 'Lista creada exitosamente',
            'data' => new ListaResource($lista),
        ], 201);
    }

    /**
     * Mostrar una lista específica
     * 
     * @param Lista $lista
     * @return JsonResponse
     */
    public function show(Lista $lista): JsonResponse
    {
        $lista->load('sistemas');
        
        return response()->json([
            'data' => new ListaResource($lista),
        ]);
    }

    /**
     * Actualizar una lista existente
     * 
     * @param UpdateListaRequest $request
     * @param Lista $lista
     * @return JsonResponse
     */
    public function update(UpdateListaRequest $request, Lista $lista): JsonResponse
    {
        $data = $request->validated();
        
        // Asegurar primera letra mayúscula en nombre si se actualiza
        if (isset($data['nombre'])) {
            $data['nombre'] = ucwords($data['nombre']);
        }

        $lista->update($data);

        return response()->json([
            'message' => 'Lista actualizada exitosamente',
            'data' => new ListaResource($lista),
        ]);
    }

    /**
     * Eliminar una lista (soft delete)
     * 
     * @param Lista $lista
     * @return JsonResponse
     */
    public function destroy(Lista $lista): JsonResponse
    {
        $lista->delete();

        return response()->json([
            'message' => 'Lista eliminada exitosamente',
        ]);
    }
}
