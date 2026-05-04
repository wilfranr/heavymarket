<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PedidoEstado;
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
            ->with(['user', 'tercero', 'maquina.listas', 'fabricante'])
            ->withCount(['referencias', 'articulos']);

        $user = $request->user();

        // El Analista solo ve pedidos en análisis de partes (En_Analisis), de cualquier vendedor
        if ($user->hasRole('Analista')) {
            $query->where('estado', 'En_Analisis');
        }
        // Vendedores ven: sus pedidos O pedidos de clientes (user con rol Cliente)
        elseif (! $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('user', function ($q2) {
                      $q2->whereHas('roles', function ($q3) {
                          $q3->where('name', 'Cliente');
                      });
                  });
            });
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
                        $referencia = $pedido->referencias->get($index);
                        if ($referencia) {
                            $imagePaths = [];
                            foreach ($request->file("referencias.{$index}.imagenes") as $file) {
                                $imagePaths[] = $file->store('pedidos/referencias', 'public');
                            }
                            SyncPedidoImages::dispatch($referencia, $imagePaths);
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
     */
    public function show(Pedido $pedido): JsonResponse
    {
        $this->authorize('view', $pedido);

        $pedido->load([
            'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'maquina.componentes.marca', 'maquina.componentes.sistema', 'fabricante', 'contacto',
            'referencias' => function ($query): void {
                $query->withCount('imagenes')
                    ->with(['referencia.marca', 'referencia.articulo.referencias.marca', 'sistema', 'lista', 'categoriaComercial', 'marca', 'imagenes', 'proveedores.tercero']);
            },
            'articulos.articulo', 'articulos.sistema',
        ]);

        return response()->json(['data' => new PedidoResource($pedido)]);
    }

    /**
     * Enviar pedido a análisis (vendedor/admin). No usa multipart: evita pérdida de campos en actualizaciones con archivos.
     */
    public function enviarAAnalisis(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        // Auto-asignar si el pedido es de un Cliente
        if ($pedido->user && $pedido->user->hasRole('Cliente')) {
            $pedido->user_id = $request->user()->id;
            $pedido->save();
        }

        // Usar máquina de estados
        if (! $pedido->puedeTransitarA(PedidoEstado::En_Analisis)) {
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

        $pedido->transitarA(PedidoEstado::En_Analisis);
        $pedido->save();

        try {
            $this->notificarAnalistas($pedido->fresh(), $request->user());
        } catch (\Exception $e) {
            // No fallar la request si la notificación falla
        }

        $pedido->refresh();
        $pedido->load([
            'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'maquina.componentes.marca', 'maquina.componentes.sistema', 'fabricante', 'contacto',
            'referencias' => function ($query): void {
                $query->withCount('imagenes')
                    ->with(['referencia.articulo.referencias.marca', 'sistema', 'lista', 'imagenes', 'proveedores.tercero']);
            },
            'articulos.articulo', 'articulos.sistema',
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
        if ($pedido->estado === PedidoEstado::Cancelado->value) {
            return response()->json([
                'message' => 'No se puede editar un pedido que ya ha sido cancelado.'
            ], 422);
        }

        try {
            // Auto-asignar: Si el pedido pertenece a un Cliente, el vendedor lo toma (se reemplaza al Cliente)
            if ($pedido->user && $pedido->user->hasRole('Cliente')) {
                $pedido->user_id = $request->user()->id;
                $pedido->save();
            }

            $estadoAnterior = $pedido->getEstadoEnum();
            $validated = $request->validated();
            $nuevoEstado = $validated['estado'] ?? null;

            // Validar máquina revisada antes de transitar a En_Analisis
            if ($nuevoEstado && $nuevoEstado === 'En_Analisis' && $estadoAnterior !== PedidoEstado::En_Analisis) {
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

            // Si cambia el estado, validar la transición
            if ($nuevoEstado && $nuevoEstado !== $pedido->estado) {
                $pedido->transitarA(PedidoEstado::from($nuevoEstado));
                unset($validated['estado']); // Ya se manejó en transitarA
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
            if ($estadoAnterior !== PedidoEstado::En_Analisis && $nuevoEstado === 'En_Analisis') {
                try {
                    $this->notificarAnalistas($pedido, $request->user());
                } catch (\Exception $e) {
                    // No fallar la request si la notificación falla
                }
            }

            // Notificar al vendedor (asesor) cuando el pedido pasa a En_Costeo
            if ($estadoAnterior !== PedidoEstado::En_Costeo && $nuevoEstado === 'En_Costeo') {
                try {
                    $this->notificarVendedorCosteo($pedido, $request->user());
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
                    'El vendedor '.$vendedor->name.' ha enviado el pedido #'.$pedido->id.' para análisis.',
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
     * Notifica al vendedor (asesor) cuando el pedido pasa a costeo
     */
    private function notificarVendedorCosteo(Pedido $pedido, User $analista): void
    {
        try {
            // Obtener el vendedor asignado al pedido
            $vendedor = $pedido->user;
            if (!$vendedor) {
                return;
            }

            $vendedor->notify(new \App\Notifications\SystemNotification(
                'pedido_en_costeo',
                'Pedido #'.$pedido->id.' en Costeo',
                'El analista '.$analista->name.' ha finalizado el análisis. El pedido #'.$pedido->id.' está listo para costeo. ¡Revísalo y cotiza las mejores opciones!',
                'pi-calculator',
                'green',
                ['id' => $pedido->id, 'tercero_id' => $pedido->tercero_id]
            ));
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

        $referencia->loadCount('imagenes');
        $referencia->load(['referencia.articulo', 'sistema', 'marca', 'lista']);

        return response()->json([
            'data' => new \App\Http\Resources\PedidoReferenciaResource($referencia),
            'message' => 'Referencia agregada exitosamente',
        ], 201);
    }

    /**
     * Agregar un proveedor a una referencia de pedido
     */
    public function updateReferencia(Request $request, Pedido $pedido, int $referenciaId): JsonResponse
    {
        if ($pedido->estado === PedidoEstado::Cancelado->value) {
            return response()->json(['message' => 'No se puede modificar un pedido cancelado.'], 422);
        }
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
        if (! $request->user()->hasAnyRole(['Analista', 'Administrador', 'super_admin'])) {
            return response()->json(['message' => 'No tiene permiso para enviar el pedido a costeo.'], 403);
        }

        $this->authorize('update', $pedido);

        // Usar máquina de estados
        if (! $pedido->puedeTransitarA(PedidoEstado::En_Costeo)) {
            return response()->json(['message' => 'Solo se pueden enviar a costeo los pedidos en estado Nuevo'], 422);
        }

        $pedido->transitarA(PedidoEstado::En_Costeo);
        $pedido->save();

        if ($vendedor = $pedido->user) {
            $vendedor->notify(new \App\Notifications\SystemNotification(
                'pedido_actualizado', 'Pedido listo para costeo #'.$pedido->id,
                'El analista '.$request->user()->name.' ha finalizado la revisión. Ya puedes iniciar el costeo.',
                'pi-dollar', 'green', ['id' => $pedido->id]
            ));
        }

        return response()->json(['data' => new PedidoResource($pedido), 'message' => 'Pedido enviado a costeo exitosamente']);
    }

    /**
     * Publicar pedido de borrador a nuevo
     */
    public function publicar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        try {
            // Auto-asignar si el pedido es de un Cliente
            if ($pedido->user && $pedido->user->hasRole('Cliente')) {
                $pedido->user_id = $request->user()->id;
            } elseif ($pedido->user_id === null) {
                $pedido->user_id = $request->user()->id;
            }

            $pedido->transitarA(PedidoEstado::Nuevo);
            $pedido->save();

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido publicado exitosamente',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Marcar pedido como cotizado (desde En_Analisis o En_Costeo)
     */
    public function cotizar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        try {
            // Asignar usuario si no tiene (analista toma ownership)
            if ($pedido->user_id === null) {
                $pedido->user_id = $request->user()->id;
                $pedido->save();
            }

            $pedido->transitarA(PedidoEstado::Cotizado);
            $pedido->save();

            // Notificar al vendedor
            if ($vendedor = $pedido->user) {
                $vendedor->notify(new \App\Notifications\SystemNotification(
                    'pedido_cotizado',
                    'Pedido #' . $pedido->id . ' cotizado',
                    'El analista ha creado la cotización. Revísala y envíala al cliente.',
                    'pi-file-edit',
                    'green',
                    ['id' => $pedido->id]
                ));
            }

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido marcado como cotizado',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Devolver pedido al analista (desde En_Costeo a En_Analisis)
     * El vendedor/asesor devuelve el pedido porque necesita cambios en las referencias
     */
    public function devolverAAnalista(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'comentario' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        try {
            // Guardar comentario en campo comentario como JSON estructurado
            $comentariosExistentes = is_array($pedido->comentario) ? $pedido->comentario : [];

            // Agregar nuevo comentario de devolución
            $comentariosExistentes[] = [
                'origen' => 'Asesor',
                'comentario' => $validated['comentario'],
                'tipo' => 'devolucion_analista',
                'fecha' => now()->toISOString(),
            ];

            $pedido->comentario = $comentariosExistentes;
            $pedido->transitarA(PedidoEstado::En_Analisis);
            $pedido->save();

            // Notificar a los analistas
            try {
                $analistas = \App\Models\User::whereHas('roles', function ($q) {
                    $q->where('name', 'Analista');
                })->get();

                foreach ($analistas as $analista) {
                    $analista->notify(new \App\Notifications\SystemNotification(
                        'pedido_devuelto_analista',
                        'Pedido #' . $pedido->id . ' devuelto a Análisis',
                        'El asesor ' . $request->user()->name . ' ha devuelto el pedido #' . $pedido->id . ' para corrección de referencias: ' . $validated['comentario'],
                        'pi-arrow-right',
                        'orange',
                        ['id' => $pedido->id]
                    ));
                }
            } catch (\Exception $e) {
                // Silenciar errores de notificación
            }

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido devuelto al analista',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

/**
     * Devolver pedido al vendedor (desde En_Analisis a Nuevo)
     * El analista devuelve el pedido porque necesita información adicional del cliente
     */
    public function devolverAVendedor(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'comentario' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        // Solo analistas y admin pueden devolver
        if (! $request->user()->hasAnyRole(['Analista', 'Administrador', 'super_admin'])) {
            return response()->json(['message' => 'Solo analistas o administradores pueden devolver pedidos al vendedor.'], 403);
        }

        try {
            // Guardar comentario en campo comentario como JSON estructurado
            $comentariosExistentes = is_array($pedido->comentario) ? $pedido->comentario : [];

            // Agregar nuevo comentario de devolución
            $comentariosExistentes[] = [
                'origen' => 'Analista',
                'comentario' => $validated['comentario'],
                'tipo' => 'devolucion',
                'fecha' => now()->toISOString(),
            ];

            $pedido->comentario = $comentariosExistentes;
            
            // Sincronizar referencias si se proporcionan (guardado automático del análisis #101)
            if ($request->has('referencias')) {
                $pedidoService = app(\App\Services\PedidoService::class);
                $pedidoService->syncReferencias($pedido, $request->input('referencias'));
            }

            $pedido->transitarA(PedidoEstado::Nuevo);
            $pedido->save();

            // Notificar al vendedor
            if ($vendedor = $pedido->user) {
                $vendedor->notify(new \App\Notifications\SystemNotification(
                    'pedido_devuelto',
                    'Pedido #' . $pedido->id . ' devuelto por analista',
                    'El analista ha devuelto el pedido para que completes la información: ' . $validated['comentario'],
                    'pi-arrow-left',
                    'orange',
                    ['id' => $pedido->id]
                ));
            }

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido devuelto al vendedor',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Aprobar o rechazar un pedido cotizado
     */
    public function responder(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'respuesta' => ['required', 'string', 'in:aprobar,rechazar'],
            'comentario' => ['nullable', 'string', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        try {
            if ($validated['respuesta'] === 'aprobar') {
                $pedido->transitarA(PedidoEstado::Aprobado);
                
                // Notificar al vendedor
                if ($vendedor = $pedido->user) {
                    $vendedor->notify(new \App\Notifications\SystemNotification(
                        'pedido_aprobado',
                        'Pedido #' . $pedido->id . ' aprobado',
                        'El cliente ha aprobado la cotización. Puedes generar la orden de trabajo.',
                        'pi-check-circle',
                        'green',
                        ['id' => $pedido->id]
                    ));
                }

                $pedido->save();

                return response()->json([
                    'data' => new PedidoResource($pedido->fresh()),
                    'message' => 'Pedido aprobado',
                ]);
            } else {
                $pedido->transitarA(PedidoEstado::Rechazado, $validated['comentario'] ?? null);
                $pedido->comentarios_rechazo = $validated['comentario'] ?? null;
                $pedido->save();

                // Notificar al vendedor
                if ($vendedor = $pedido->user) {
                    $vendedor->notify(new \App\Notifications\SystemNotification(
                        'pedido_rechazado',
                        'Pedido #' . $pedido->id . ' rechazado',
                        'El cliente ha rechazado la cotización: ' . ($validated['comentario'] ?? 'Sin comentario'),
                        'pi-times-circle',
                        'red',
                        ['id' => $pedido->id]
                    ));
                }

                return response()->json([
                    'data' => new PedidoResource($pedido->fresh()),
                    'message' => 'Pedido rechazado',
                ]);
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Marcar como enviado
     */
    public function enviar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        try {
            $pedido->transitarA(PedidoEstado::Enviado);
            $pedido->save();

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido marcado como enviado',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Marcar como entregado
     */
    public function entregar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        try {
            $pedido->transitarA(PedidoEstado::Entregado);
            $pedido->save();

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido marcado como entregado',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Cancelar pedido (desde cualquier estado excepto finales)
     */
    public function cancelar(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => ['nullable', 'string', 'max:500'],
        ]);

        $this->authorize('delete', $pedido);

        try {
            $pedido->transitarA(PedidoEstado::Cancelado);
            $pedido->comentarios_rechazo = $validated['motivo'] ?? 'Cancelado por el usuario';
            $pedido->save();

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido cancelado',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Guardar datos de costeo de forma masiva
     */
    public function guardarCosteo(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('update', $pedido);

        $validated = $request->validate([
            'referencias' => ['required', 'array'],
            'referencias.*.id' => ['required', 'exists:pedido_referencia,id'],
            'referencias.*.proveedores' => ['sometimes', 'array'],
            'referencias.*.proveedores.*.id' => ['nullable', 'exists:pedido_referencia_proveedor,id'],
            'referencias.*.proveedores.*.proveedor_id' => ['required_with:referencias.*.proveedores.*', 'exists:terceros,id'],
            'referencias.*.proveedores.*.marca_id' => ['nullable', 'exists:listas,id'],
            'referencias.*.proveedores.*.dias_entrega' => ['required', 'integer', 'min:0'],
            'referencias.*.proveedores.*.costo_unidad' => ['required', 'numeric', 'min:0'],
            'referencias.*.proveedores.*.utilidad' => ['required', 'numeric', 'min:0'],
            'referencias.*.proveedores.*.cantidad' => ['required', 'integer', 'min:1'],
            'referencias.*.proveedores.*.seleccionado' => ['required', 'boolean'],
        ]);

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($pedido, $validated) {
                foreach ($validated['referencias'] as $refData) {
                    $pedidoReferencia = $pedido->referencias()->findOrFail($refData['id']);

                    $proveedores = $refData['proveedores'] ?? [];

                    // Obtener IDs actuales en la base de datos
                    $currentIds = $pedidoReferencia->proveedores()->pluck('id')->toArray();
                    
                    // Obtener IDs enviados que deben conservarse
                    $idsToKeep = collect($proveedores)
                        ->filter(fn($p) => isset($p['id']) && $p['id'])
                        ->pluck('id')
                        ->map(fn($id) => (int)$id)
                        ->toArray();

                    // Determinar qué IDs deben ser eliminados
                    $idsToDelete = array_diff($currentIds, $idsToKeep);
                    
                    if (!empty($idsToDelete)) {
                        $pedidoReferencia->proveedores()->whereIn('id', $idsToDelete)->delete();
                    }

                    foreach ($proveedores as $provData) {
                        $ubicacion = 'Nacional';
                        $tercero = \App\Models\Tercero::with('country')->find($provData['proveedor_id']);
                        if ($tercero && ($tercero->country_id != 48 && ($tercero->country->iso2 ?? '') != 'CO')) {
                            $ubicacion = 'Internacional';
                        }

                        $calcData = array_merge($provData, [
                            'ubicacion' => $ubicacion, 
                            'costo_unidad' => $provData['costo_unidad']
                        ]);
                        $valores = $this->pedidoService->calcularValores($calcData, $pedidoReferencia);
                        
                        $updateData = [
                            'proveedor_id' => $provData['proveedor_id'],
                            'marca_id' => $provData['marca_id'],
                            'dias_entrega' => $provData['dias_entrega'],
                            'costo_unidad' => $provData['costo_unidad'],
                            'utilidad' => $provData['utilidad'],
                            'cantidad' => $provData['cantidad'],
                            'ubicacion' => $ubicacion,
                            'valor_unidad' => $valores['valor_unidad'],
                            'valor_total' => $valores['valor_total'],
                            'estado' => $provData['seleccionado'] ? 1 : 0
                        ];

                        if (isset($provData['id']) && $provData['id']) {
                            $pedidoReferencia->proveedores()->where('id', $provData['id'])->update($updateData);
                        } else {
                            $pedidoReferencia->proveedores()->create($updateData);
                        }
                    }
                }
            });

            // Cargar relaciones necesarias para la respuesta
            $pedido->load([
                'user', 'tercero', 'maquina.fabricante', 'maquina.listas', 'fabricante', 'contacto',
                'referencias' => function ($query): void {
                    $query->withCount('imagenes')
                        ->with(['referencia.marca', 'referencia.articulo.referencias.marca', 'sistema', 'lista', 'categoriaComercial', 'marca', 'imagenes', 'proveedores.tercero']);
                },
                'articulos.articulo', 'articulos.sistema',
            ]);

            return response()->json([
                'message' => 'Costeo guardado exitosamente',
                'data' => new \App\Http\Resources\PedidoResource($pedido)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al guardar costeo', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'pedido_id' => $pedido->id,
            ]);
            
            return response()->json([
                'message' => 'Error al guardar el costeo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
