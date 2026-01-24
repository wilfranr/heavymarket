<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{StorePedidoRequest, UpdatePedidoRequest};
use App\Http\Resources\{PedidoResource, PedidoCollection};
use App\Models\Pedido;
use Illuminate\Http\{JsonResponse, Request};
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
     * @param Request $request
     * @return JsonResponse
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

        // Filtro por máquina
        if ($request->filled('maquina_id')) {
            $query->where('maquina_id', $request->input('maquina_id'));
        }

        // Filtro por vendedor (user_id)
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
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
     * 
     * @param StorePedidoRequest $request
     * @return JsonResponse
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
     * 
     * @param Pedido $pedido
     * @return JsonResponse
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
            'referencias.proveedores.tercero',
            'articulos.articulo'
        ]);

        return response()->json([
            'data' => new PedidoResource($pedido),
        ]);
    }

    /**
     * Actualizar un pedido existente
     * 
     * @param UpdatePedidoRequest $request
     * @param Pedido $pedido
     * @return JsonResponse
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
     * 
     * @param Pedido $pedido
     * @return JsonResponse
     */
    public function destroy(Pedido $pedido): JsonResponse
    {
        try {
            // Verificar permisos
            if (!auth()->user()->can('delete', $pedido)) {
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
     *
     * @param Request $request
     * @param Pedido $pedido
     * @return JsonResponse
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
     *
     * @param Request $request
     * @param Pedido $pedido
     * @param int $referenciaId
     * @return JsonResponse
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
     *
     * @param Pedido $pedido
     * @param int $referenciaId
     * @return JsonResponse
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

    /**
     * Agregar un proveedor a una referencia de pedido
     *
     * @param Request $request
     * @param Pedido $pedido
     * @param int $referenciaId
     * @return JsonResponse
     */
    public function addProveedor(Request $request, Pedido $pedido, int $referenciaId): JsonResponse
    {
        $pedidoReferencia = $pedido->referencias()->findOrFail($referenciaId);

        $validated = $request->validate([
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'dias_entrega' => ['required', 'integer', 'min:0'],
            'costo_unidad' => ['required', 'numeric', 'min:0'],
            'utilidad' => ['required', 'numeric', 'min:0'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'ubicacion' => ['required', 'string', 'in:Nacional,Internacional'],
            'estado' => ['nullable', 'boolean'],
        ]);

        try {
            // Calcular valores automáticamente
            $valores = $this->calcularValores($validated, $pedidoReferencia);
            $validated = array_merge($validated, $valores);

            $proveedor = $pedidoReferencia->proveedores()->create($validated);
            $proveedor->load(['tercero', 'marca']);

            return response()->json([
                'data' => new \App\Http\Resources\PedidoReferenciaProveedorResource($proveedor),
                'message' => 'Proveedor agregado exitosamente',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al agregar el proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar un proveedor de una referencia de pedido
     *
     * @param Request $request
     * @param Pedido $pedido
     * @param int $referenciaId
     * @param int $proveedorId
     * @return JsonResponse
     */
    public function updateProveedor(Request $request, Pedido $pedido, int $referenciaId, int $proveedorId): JsonResponse
    {
        $pedidoReferencia = $pedido->referencias()->findOrFail($referenciaId);
        $proveedor = $pedidoReferencia->proveedores()->findOrFail($proveedorId);

        $validated = $request->validate([
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'dias_entrega' => ['sometimes', 'integer', 'min:0'],
            'costo_unidad' => ['sometimes', 'numeric', 'min:0'],
            'utilidad' => ['sometimes', 'numeric', 'min:0'],
            'cantidad' => ['sometimes', 'integer', 'min:1'],
            'ubicacion' => ['sometimes', 'string', 'in:Nacional,Internacional'],
            'estado' => ['nullable', 'boolean'],
        ]);

        try {
            // Recalcular valores si cambió costo, utilidad, cantidad o ubicación
            if (isset($validated['costo_unidad']) || isset($validated['utilidad']) || 
                isset($validated['cantidad']) || isset($validated['ubicacion'])) {
                $datosCompletos = array_merge($proveedor->toArray(), $validated);
                $valores = $this->calcularValores($datosCompletos, $pedidoReferencia);
                $validated = array_merge($validated, $valores);
            }

            $proveedor->update($validated);
            $proveedor->load(['tercero', 'marca']);

            return response()->json([
                'data' => new \App\Http\Resources\PedidoReferenciaProveedorResource($proveedor),
                'message' => 'Proveedor actualizado exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un proveedor de una referencia de pedido
     *
     * @param Pedido $pedido
     * @param int $referenciaId
     * @param int $proveedorId
     * @return JsonResponse
     */
    public function deleteProveedor(Pedido $pedido, int $referenciaId, int $proveedorId): JsonResponse
    {
        try {
            $pedidoReferencia = $pedido->referencias()->findOrFail($referenciaId);
            $proveedor = $pedidoReferencia->proveedores()->findOrFail($proveedorId);
            $proveedor->delete();

            return response()->json([
                'message' => 'Proveedor eliminado exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calcula los valores de unidad y total según ubicación (Nacional/Internacional)
     *
     * @param array $datos
     * @param \App\Models\PedidoReferencia $pedidoReferencia
     * @return array
     */
    private function calcularValores(array $datos, \App\Models\PedidoReferencia $pedidoReferencia): array
    {
        $costo_unidad = (float) ($datos['costo_unidad'] ?? 0);
        $utilidad = (float) ($datos['utilidad'] ?? 0);
        $cantidad = (int) ($datos['cantidad'] ?? 1);
        $ubicacion = $datos['ubicacion'] ?? 'Nacional';

        if ($ubicacion === 'Internacional') {
            // Obtener empresa activa para TRM y flete
            $empresa = \App\Models\Empresa::where('estado', 1)->first();
            $trm = $empresa?->trm ?? 1;
            $flete = $empresa?->flete ?? 0;

            // Obtener peso del artículo (necesitamos la referencia)
            $referencia = $pedidoReferencia->referencia;
            $peso = 0; // Por defecto, se puede obtener de la relación articulo->medidas

            // Convertir peso de gramos a libras (1 libra = 453.592 gramos)
            $peso_libras = $peso / 453.592;

            // Calcular: costo_base_usd = (peso_libras * flete) + costo_unidad
            $costo_base_usd = ($peso_libras * $flete) + $costo_unidad;
            $costo_base_cop = $costo_base_usd * $trm;

            // Aplicar utilidad
            $valor_unidad = $costo_base_cop + ($utilidad * $costo_base_cop / 100);

            // Redondear a centenas
            $valor_unidad = round($valor_unidad, -2);
        } else {
            // Lógica para proveedores nacionales
            $valor_unidad = $costo_unidad + ($costo_unidad * $utilidad / 100);
            // Redondear a enteros
            $valor_unidad = round($valor_unidad);
        }

        // Calcular valor total
        $valor_total = $valor_unidad * $cantidad;

        return [
            'valor_unidad' => $valor_unidad,
            'valor_total' => $valor_total,
        ];
    }
}
