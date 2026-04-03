<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{StorePedidoRequest, UpdatePedidoRequest};
use App\Http\Resources\{PedidoResource, PedidoCollection};
use App\Models\Pedido;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;
use App\Notifications\SystemNotification;

/**
 * Controlador API para gestión de Pedidos
 * 
 * Maneja todas las operaciones CRUD de pedidos a través del API REST.
 * Implementa filtros, búsqueda, paginación y manejo de relaciones.
 */
class PedidoController extends Controller
{
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests;

    /**
     * @var PedidoService
     */
    protected $pedidoService;

    /**
     * PedidoController constructor.
     * 
     * @param PedidoService $pedidoService
     */
    public function __construct(\App\Services\PedidoService $pedidoService)
    {
        $this->pedidoService = $pedidoService;
    }

    /**
     * Listar todos los pedidos con filtros opcionales
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Pedido::class);

        $query = Pedido::query()
            ->with(['user', 'tercero', 'maquina', 'fabricante'])
            ->withCount(['referencias', 'articulos']);

        $user = $request->user();
        
        // El Analista solo ve pedidos 'Nuevo' (de cualquier vendedor)
        if ($user->hasRole('Analista')) {
            $query->where('estado', 'Nuevo');
        } 
        // Vendedores y otros roles no administrativos solo ven sus propios pedidos
        elseif (!$user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])) {
            $query->where('user_id', $user->id);
        }

        // Filtros (Estado, Tercero, Fabricante, Máquina, Vendedor)
        foreach (['estado', 'tercero_id', 'fabricante_id', 'maquina_id', 'user_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        // Búsqueda en comentarios
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('comentario', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        // Ordenamiento y Paginación
        $pedidos = $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_order', 'desc'))
            ->paginate((int) $request->input('per_page', 15));

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
            $pedido = $this->pedidoService->create($request->validated(), $request->user());

            // Procesar archivos de imagen si existen (la lógica de archivos permanece en el controller o request)
            if ($request->has('referencias')) {
                foreach ($request->input('referencias') as $index => $refData) {
                    if ($request->hasFile("referencias.{$index}.imagenes")) {
                        $referencia = $pedido->referencias[$index];
                        foreach ($request->file("referencias.{$index}.imagenes") as $file) {
                            $path = $file->store('pedidos/referencias', 'public');
                            $referencia->imagenes()->create([
                                'imagen' => $path,
                                'origen' => \App\Models\PedidoReferenciaImagen::ORIGEN_ASESOR
                            ]);
                        }
                    }
                }
            }

            return response()->json([
                'data' => new PedidoResource($pedido),
                'message' => 'Pedido creado exitosamente',
            ], 201);

        } catch (\Exception $e) {
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
        $this->authorize('view', $pedido);

        $pedido->load([
            'user', 'tercero', 'maquina.fabricantes', 'maquina.listas', 'fabricante', 'contacto',
            'referencias.referencia', 'referencias.sistema', 'referencias.lista', 'referencias.imagenes',
            'referencias.proveedores.tercero', 'articulos.articulo', 'articulos.sistema'
        ]);

        return response()->json(['data' => new PedidoResource($pedido)]);
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
            $pedido = $this->pedidoService->update($pedido, $request->validated());

            // Procesar imágenes nuevas de forma asíncrona si existen
            if ($request->has('referencias')) {
                foreach ($request->input('referencias') as $index => $refData) {
                    if ($request->hasFile("referencias.{$index}.imagenes_nuevas")) {
                        $referencia = $pedido->referencias()->find($refData['id'] ?? null);
                        if ($referencia) {
                            $imagePaths = [];
                            foreach ($request->file("referencias.{$index}.imagenes_nuevas") as $file) {
                                $imagePaths[] = $file->store('pedidos/referencias', 'public');
                            }
                            // Despachar Job para registro en DB
                        \App\Jobs\SyncPedidoImages::dispatch($referencia, $imagePaths);
                        }
                    }
                }
            }

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
        $this->authorize('delete', $pedido);
        $pedido->delete();
        return response()->json(['message' => 'Pedido eliminado exitosamente'], 204);
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
            'mostrar_referencia' => ['nullable', 'boolean'],
            'estado' => ['nullable', 'boolean'],
        ]);

        $referencia = $pedido->referencias()->create($validated);
        return response()->json([
            'data' => new \App\Http\Resources\PedidoReferenciaResource($referencia->load(['referencia', 'sistema', 'marca'])),
            'message' => 'Referencia agregada exitosamente',
        ], 201);
    }

    /**
     * Agregar un proveedor a una referencia de pedido
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
        ]);

        $valores = $this->pedidoService->calcularValores($validated, $pedidoReferencia);
        $proveedor = $pedidoReferencia->proveedores()->create(array_merge($validated, $valores));

        return response()->json([
            'data' => new \App\Http\Resources\PedidoReferenciaProveedorResource($proveedor->load(['tercero', 'marca'])),
            'message' => 'Proveedor agregado exitosamente',
        ], 201);
    }

    /**
     * Actualizar un proveedor
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
        ]);

        $datosCompletos = array_merge($proveedor->toArray(), $validated);
        $valores = $this->pedidoService->calcularValores($datosCompletos, $pedidoReferencia);
        $proveedor->update(array_merge($validated, $valores));

        return response()->json([
            'data' => new \App\Http\Resources\PedidoReferenciaProveedorResource($proveedor->load(['tercero', 'marca'])),
            'message' => 'Proveedor actualizado exitosamente',
        ]);
    }

    /**
     * Enviar pedido a fase de costeo
     */
    public function enviarACosteo(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);
        if ($pedido->estado !== 'Nuevo') {
            return response()->json(['message' => 'Solo se pueden enviar a costeo los pedidos en estado Nuevo'], 422);
        }

        $pedido->update(['estado' => 'En_Costeo']);
        if ($vendedor = $pedido->user) {
            $vendedor->notify(new \App\Notifications\SystemNotification(
                'pedido_actualizado', 'Pedido listo para costeo #' . $pedido->id,
                'El analista ' . $request->user()->name . ' ha finalizado la revisión. Ya puedes iniciar el costeo.',
                'pi-dollar', 'green', ['id' => $pedido->id]
            ));
        }

        return response()->json(['data' => new PedidoResource($pedido), 'message' => 'Pedido enviado a costeo exitosamente']);
    }
}
