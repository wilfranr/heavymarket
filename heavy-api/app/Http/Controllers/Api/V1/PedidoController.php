<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePedidoRequest;
use App\Http\Requests\UpdatePedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Pedidos
 *
 * Maneja todas las operaciones CRUD de pedidos a través del API REST.
 * Implementa filtros, búsqueda, paginación y manejo de relaciones.
 */
class PedidoController extends Controller
{
    /**
     * Listar todos los pedidos con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam estado string Filtrar por estado. Example: Nuevo
     * @queryParam tercero_id int Filtrar por tercero. Example: 5
     * @queryParam search string Buscar en comentarios. Example: urgente
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pedido::query()
            ->with(['user', 'tercero', 'maquina', 'fabricante'])
            ->withCount(['referencias', 'articulos']);

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        // Filtro por tercero
        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        // Filtro por fabricante
        if ($request->filled('fabricante_id')) {
            $query->where('fabricante_id', $request->input('fabricante_id'));
        }

        // Búsqueda en comentarios
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('comentario', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $pedidos = $query->paginate($perPage);

        return response()->json([
            'data' => PedidoResource::collection($pedidos),
            'meta' => [
                'current_page' => $pedidos->currentPage(),
                'last_page' => $pedidos->lastPage(),
                'per_page' => $pedidos->perPage(),
                'total' => $pedidos->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo pedido
     */
    public function store(StorePedidoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Crear el pedido
            $pedido = Pedido::create([
                'user_id' => $request->user()->id,
                'tercero_id' => $request->input('tercero_id'),
                'direccion' => $request->input('direccion'),
                'comentario' => $request->input('comentario'),
                'contacto_id' => $request->input('contacto_id'),
                'estado' => $request->input('estado', 'Nuevo'),
                'maquina_id' => $request->input('maquina_id'),
                'fabricante_id' => $request->input('fabricante_id'),
            ]);

            // Agregar referencias si existen
            if ($request->has('referencias')) {
                foreach ($request->input('referencias') as $referencia) {
                    $pedido->referencias()->create([
                        'referencia_id' => $referencia['referencia_id'],
                        'sistema_id' => $referencia['sistema_id'] ?? null,
                        'marca_id' => $referencia['marca_id'] ?? null,
                        'definicion' => $referencia['definicion'] ?? null,
                        'cantidad' => $referencia['cantidad'],
                        'comentario' => $referencia['comentario'] ?? null,
                        'imagen' => $referencia['imagen'] ?? null,
                        'mostrar_referencia' => $referencia['mostrar_referencia'] ?? true,
                        'estado' => $referencia['estado'] ?? true,
                    ]);
                }
            }

            // Agregar artículos si existen
            if ($request->has('articulos')) {
                foreach ($request->input('articulos') as $articulo) {
                    $pedido->articulos()->create([
                        'articulo_id' => $articulo['articulo_id'],
                        'cantidad' => $articulo['cantidad'],
                        'precio_unitario' => $articulo['precio_unitario'] ?? null,
                    ]);
                }
            }

            DB::commit();

            // Cargar relaciones para la respuesta
            $pedido->load(['user', 'tercero', 'referencias', 'articulos']);

            return response()->json([
                'data' => new PedidoResource($pedido),
                'message' => 'Pedido creado exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear el pedido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un pedido específico
     */
    public function show(Pedido $pedido): JsonResponse
    {
        $pedido->load([
            'user',
            'tercero',
            'maquina',
            'fabricante',
            'contacto',
            'referencias.referencia',
            'articulos.articulo',
        ]);

        return response()->json([
            'data' => new PedidoResource($pedido),
        ]);
    }

    /**
     * Actualizar un pedido existente
     */
    public function update(UpdatePedidoRequest $request, Pedido $pedido): JsonResponse
    {
        try {
            $pedido->update($request->validated());

            $pedido->load(['user', 'tercero', 'maquina', 'fabricante']);

            return response()->json([
                'data' => new PedidoResource($pedido),
                'message' => 'Pedido actualizado exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el pedido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un pedido
     */
    public function destroy(Pedido $pedido): JsonResponse
    {
        try {
            // Verificar permisos
            if (! auth()->user()->can('delete', $pedido)) {
                return response()->json([
                    'message' => 'No autorizado para eliminar este pedido',
                ], 403);
            }

            $pedido->delete();

            return response()->json([
                'message' => 'Pedido eliminado exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el pedido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Agregar una referencia a un pedido
     */
    public function addReferencia(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'referencia_id' => ['required', 'integer', 'exists:referencias,id'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'definicion' => ['nullable', 'string', 'max:255'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'comentario' => ['nullable', 'string'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'mostrar_referencia' => ['nullable', 'boolean'],
            'estado' => ['nullable', 'boolean'],
        ]);

        try {
            $pedidoReferencia = $pedido->referencias()->create($validated);
            $pedidoReferencia->load(['referencia', 'sistema', 'marca']);

            return response()->json([
                'data' => new \App\Http\Resources\PedidoReferenciaResource($pedidoReferencia),
                'message' => 'Referencia agregada exitosamente',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al agregar la referencia',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar una referencia de un pedido
     */
    public function updateReferencia(Request $request, Pedido $pedido, int $referenciaId): JsonResponse
    {
        $pedidoReferencia = $pedido->referencias()->findOrFail($referenciaId);

        $validated = $request->validate([
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'definicion' => ['nullable', 'string', 'max:255'],
            'cantidad' => ['sometimes', 'integer', 'min:1'],
            'comentario' => ['nullable', 'string'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'mostrar_referencia' => ['nullable', 'boolean'],
            'estado' => ['nullable', 'boolean'],
        ]);

        try {
            $pedidoReferencia->update($validated);
            $pedidoReferencia->load(['referencia', 'sistema', 'marca']);

            return response()->json([
                'data' => new \App\Http\Resources\PedidoReferenciaResource($pedidoReferencia),
                'message' => 'Referencia actualizada exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la referencia',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una referencia de un pedido
     */
    public function deleteReferencia(Pedido $pedido, int $referenciaId): JsonResponse
    {
        try {
            $pedidoReferencia = $pedido->referencias()->findOrFail($referenciaId);
            $pedidoReferencia->delete();

            return response()->json([
                'message' => 'Referencia eliminada exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la referencia',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
