<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{StoreTerceroRequest, UpdateTerceroRequest};
use App\Http\Resources\TerceroResource;
use App\Models\Tercero;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Storage;

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
        if ($request->filled('tipo')) {
             $query->where('tipo', $request->input('tipo'));
        }
        
        // Legacy or specific filters mapping
        if ($request->filled('es_cliente')) {
             if ($request->input('es_cliente')) {
                 $query->whereIn('tipo', ['Cliente', 'Ambos']);
             }
        }
        if ($request->filled('es_proveedor')) {
             if ($request->input('es_proveedor')) {
                 $query->whereIn('tipo', ['Proveedor', 'Ambos']);
             }
        }

        // Búsqueda por nombre o documento
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('numero_documento', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
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
            $data = $request->validated();
            
            // Handle Files
            $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
            foreach ($fileFields as $field) {
                if ($request->hasFile($field)) {
                    $data[$field] = $request->file($field)->store('terceros/documentos', 'public');
                }
            }

            $tercero = Tercero::create($data);

            // Handle Relationships
            if ($request->filled('maquina_id')) {
                // Assuming ManyToMany or OneToMany? Model says belongsToMany maquinas.
                // If it's single selection in frontend, sync array.
                $tercero->maquinas()->sync([$request->input('maquina_id')]);
            }
            
            if ($request->filled('fabricante_id')) {
                $tercero->fabricantes()->sync($request->input('fabricante_id'));
            }
            
            if ($request->filled('sistema_id')) {
                $tercero->sistemas()->sync($request->input('sistema_id'));
            }

            return response()->json([
                'data' => new TerceroResource($tercero->load(['maquinas', 'fabricantes', 'sistemas'])),
                'message' => 'Tercero creado exitosamente',
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error creating tercero: ' . $e->getMessage());
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
        $tercero->load(['contactos', 'direcciones', 'fabricantes', 'sistemas', 'maquinas']);

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
            $data = $request->validated();
            
            // Handle Files
            $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
            foreach ($fileFields as $field) {
                if ($request->hasFile($field)) {
                    // Delete old file if exists
                    if ($tercero->{$field}) {
                         Storage::disk('public')->delete($tercero->{$field});
                    }
                    $data[$field] = $request->file($field)->store('terceros/documentos', 'public');
                }
            }

            $tercero->update($data);

             // Handle Relationships if passed (optional update logic)
            if ($request->has('maquina_id')) { // Check existence key to allow unselecting
                 $tercero->maquinas()->sync($request->input('maquina_id') ? [$request->input('maquina_id')] : []);
            }
            if ($request->has('fabricante_id')) {
                 $tercero->fabricantes()->sync($request->input('fabricante_id'));
            }
            if ($request->has('sistema_id')) {
                 $tercero->sistemas()->sync($request->input('sistema_id'));
            }

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
            // Delete files
            $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
             foreach ($fileFields as $field) {
                if ($tercero->{$field}) {
                     Storage::disk('public')->delete($tercero->{$field});
                }
            }
            
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
