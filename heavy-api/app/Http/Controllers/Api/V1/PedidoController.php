<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePedidoRequest;
use App\Http\Requests\UpdatePedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Jobs\SyncPedidoImages;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     * @param  PedidoService  $pedidoService
     */
    public function __construct(\App\Services\PedidoService $pedidoService)
    {
        $this->pedidoService = $pedidoService;
    }

    /**
     * Listar todos los pedidos con filtros opcionales
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Pedido::class);

        $query = Pedido::query()
            ->with(['user', 'tercero', 'maquina', 'fabricante'])
            ->withCount(['referencias', 'articulos']);

        $user = $request->user();

        // El Analista solo ve pedidos en análisis de partes (En_Analisis), de cualquier vendedor
        if ($user->hasRole('Analista')) {
            $query->where('estado', 'En_Analisis');
        }
        // Vendedores y otros roles no administrativos solo ven sus propios pedidos
        elseif (! $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])) {
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
     */
    public function store(StorePedidoRequest $request): JsonResponse
    {
        try {
            $pedido = $this->pedidoService->create($request->validated(), $request->user());

            // Archivos al disco en la petición; filas en BD vía cola (mismo criterio que update)
            if ($request->has('referencias')) {
                foreach ($request->input('referencias') as $index => $refData) {
                    if ($request->hasFile("referencias.{$index}.imagenes")) {
                        $referencia = $pedido->referencias[$index];
                        $imagePaths = [];
                        foreach ($request->file("referencias.{$index}.imagenes") as $file) {
                            $imagePaths[] = $file->store('pedidos/referencias', 'public');
                        }
                        SyncPedidoImages::dispatch($referencia, $imagePaths);
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
     */
    public function show(Pedido $pedido): JsonResponse
    {
        $this->authorize('view', $pedido);

        $pedido->load([
            'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'fabricante', 'contacto',
            'referencias.referencia', 'referencias.sistema', 'referencias.lista', 'referencias.imagenes',
            'referencias.proveedores.tercero', 'articulos.articulo', 'articulos.sistema',
        ]);

        return response()->json(['data' => new PedidoResource($pedido)]);
    }

    /**
     * Enviar pedido a análisis (vendedor/admin). No usa multipart: evita pérdida de campos en actualizaciones con archivos.
     */
    public function enviarAAnalisis(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        if ($pedido->estado !== 'Nuevo') {
            return response()->json([
                'message' => 'Solo los pedidos en estado Nuevo pueden enviarse a análisis.',
            ], 422);
        }

        if ($pedido->maquina_id) {
            $pedido->loadMissing('maquina');
            $maquina = $pedido->maquina;
            if (! $maquina || $maquina->estado_revision !== 'revisado') {
                return response()->json([
                    'message' => 'La máquina debe estar en estado "Revisado" para enviar a análisis',
                ], 422);
            }
        }

        $pedido->update(['estado' => 'En_Analisis']);

        try {
            $this->notificarAnalistas($pedido->fresh(), $request->user());
        } catch (\Exception $e) {
            // No fallar la request si la notificación falla
        }

        $pedido->refresh();
        $pedido->load([
            'user', 'tercero', 'maquina.fabricante', 'fabricante', 'contacto',
            'referencias.referencia', 'referencias.sistema', 'referencias.lista', 'referencias.imagenes',
            'referencias.proveedores.tercero', 'articulos.articulo', 'articulos.sistema',
        ]);

        return response()->json([
            'data' => new PedidoResource($pedido),
            'message' => 'Pedido enviado a análisis exitosamente',
        ]);
    }

    /**
     * Actualizar un pedido existente
     */
    public function update(UpdatePedidoRequest $request, Pedido $pedido): JsonResponse
    {
        try {
            $estadoAnterior = $pedido->estado;
            $validated = $request->validated();
            $nuevoEstado = $validated['estado'] ?? null;

            // Validar máquina revisada antes de persistir (evita dejar el pedido en En_Analisis y responder 422).
            if ($estadoAnterior !== 'En_Analisis' && $nuevoEstado === 'En_Analisis') {
                $maquinaId = array_key_exists('maquina_id', $validated)
                    ? $validated['maquina_id']
                    : $pedido->maquina_id;
                if ($maquinaId) {
                    $maquina = Maquina::query()->find($maquinaId);
                    if (! $maquina || $maquina->estado_revision !== 'revisado') {
                        return response()->json([
                            'message' => 'La máquina debe estar en estado "Revisado" para enviar a análisis',
                        ], 422);
                    }
                }
            }

            $pedido = $this->pedidoService->update($pedido, $validated);

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
                            SyncPedidoImages::dispatch($referencia, $imagePaths);
                        }
                    }
                }
            }

            // Notificar a analistas cuando el pedido cambia a En_Analisis
            if ($estadoAnterior !== 'En_Analisis' && $nuevoEstado === 'En_Analisis') {
                try {
                    $this->notificarAnalistas($pedido, $request->user());
                } catch (\Exception $e) {
                    // No fallar la request si la notificación falla
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
     * Notifica a todos los analistas cuando un pedido se envía a análisis
     */
    private function notificarAnalistas(Pedido $pedido, User $vendedor): void
    {
        try {
            // Buscar usuarios con rol Analista (mismo rol definido en BD / Spatie)
            $analistas = \App\Models\User::whereHas('roles', function ($q) {
                $q->where('name', 'Analista');
            })->get();

            foreach ($analistas as $analista) {
                $analista->notify(new \App\Notifications\SystemNotification(
                    'pedido_en_analisis',
                    'Pedido #'.$pedido->id.' enviado a Análisis',
                    'El vendedor '.$vendedor->name.' ha enviado el pedido #'.$pedido->id.' para análisis. ¡Tómalo y comienza a trabajar!',
                    'pi-search',
                    'blue',
                    ['id' => $pedido->id, 'tercero_id' => $pedido->tercero_id]
                ));
            }
        } catch (\Exception $e) {
            // Silenciar errores de notificación
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
            'data' => new \App\Http\Resources\PedidoReferenciaResource($referencia->load(['referencia', 'sistema', 'marca', 'lista'])),
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
                'pedido_actualizado', 'Pedido listo para costeo #'.$pedido->id,
                'El analista '.$request->user()->name.' ha finalizado la revisión. Ya puedes iniciar el costeo.',
                'pi-dollar', 'green', ['id' => $pedido->id]
            ));
        }

        return response()->json(['data' => new PedidoResource($pedido), 'message' => 'Pedido enviado a costeo exitosamente']);
    }
}
