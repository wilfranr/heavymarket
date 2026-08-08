<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PedidoEstado;
use App\Events\NewReferencesAvailable;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePedidoRequest;
use App\Http\Requests\UpdatePedidoRequest;
use App\Http\Resources\PedidoReferenciaProveedorResource;
use App\Http\Resources\PedidoReferenciaResource;
use App\Http\Resources\PedidoResource;
use App\Jobs\SyncPedidoImages;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use App\Notifications\ProviderNewReferencesNotification;
use App\Notifications\SystemNotification;
use App\Services\CotizacionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
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
    use AuthorizesRequests;

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
        // Vendedores ven: sus pedidos o pedidos con origen landing
        elseif (! $user->hasAnyRole(['super_admin', 'Administrador'])) {
            $query->visibleParaVendedor($user);
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
            'user', 'tercero.city', 'maquina.fabricante', 'maquina.listas', 'maquina.componentes.marca', 'maquina.componentes.sistema', 'fabricante', 'contacto',
            'referencias' => function ($query): void {
                $query->withCount('imagenes')
                    ->with(['referencia.marca', 'referencia.articulo.referencias.marca', 'referencia.articulo.medidas', 'referencia.articulo.piezaEstandar', 'referencia.articulo.articuloJuegos.referencia.articulo', 'referencia.articulo.articuloJuegos.articulo', 'sistema', 'lista', 'categoriaComercial', 'categoriasComerciales', 'marca', 'imagenes', 'proveedores.tercero']);
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

        $this->asignarPedidoExternoAlVendedor($pedido, $request->user());

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
                    ->with(['referencia.articulo.referencias.marca', 'referencia.articulo.medidas', 'referencia.articulo.piezaEstandar', 'referencia.articulo.articuloJuegos.referencia.articulo', 'referencia.articuloJuegos.articulo', 'sistema', 'lista', 'imagenes', 'proveedores.tercero']);
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
                'message' => 'No se puede editar un pedido que ya ha sido cancelado.',
            ], 422);
        }

        try {
            $this->asignarPedidoExternoAlVendedor($pedido, $request->user());

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
                    $this->notificarProveedoresCosteo($pedido);
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
            $analistas = User::whereHas('roles', function ($q) {
                $q->where('name', 'Analista');
            })->get();

            foreach ($analistas as $analista) {
                $analista->notify(new SystemNotification(
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
            if (! $vendedor) {
                return;
            }

            $vendedor->notify(new SystemNotification(
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
            'data' => new PedidoReferenciaResource($referencia),
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
            'data' => new PedidoReferenciaProveedorResource($proveedor->load(['tercero', 'marca'])),
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
            'data' => new PedidoReferenciaProveedorResource($proveedor->load(['tercero', 'marca'])),
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
            $vendedor->notify(new SystemNotification(
                'pedido_actualizado', 'Pedido listo para costeo #'.$pedido->id,
                'El analista '.$request->user()->name.' ha finalizado la revisión. Ya puedes iniciar el costeo.',
                'pi-dollar', 'green', ['id' => $pedido->id]
            ));
        }

        // Notificar a proveedores calificados
        try {
            $this->notificarProveedoresCosteo($pedido);
        } catch (\Exception $e) {
            // Silenciar errores de notificación
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
            $this->asignarPedidoExternoAlVendedor($pedido, $request->user());

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
                $vendedor->notify(new SystemNotification(
                    'pedido_cotizado',
                    'Pedido #'.$pedido->id.' cotizado',
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
     * Devolver pedido a costeo desde Cotizado (recosteo sin items nuevos).
     * Transaccion: anular cotizacion activa + transitar a En_Costeo + comentario obligatorio.
     */
    public function devolverACosteo(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'comentario' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        if ($pedido->estado !== PedidoEstado::Cotizado->value) {
            return response()->json([
                'message' => 'Solo los pedidos en estado Cotizado pueden devolverse a costeo.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($pedido, $validated) {
                // 1. Anular cotizacion activa
                $cotizacionService = app(CotizacionService::class);
                $cotizacionService->anularCotizacionActiva($pedido, $validated['comentario']);

                // 2. Registrar comentario
                $comentariosExistentes = is_array($pedido->comentario) ? $pedido->comentario : [];
                $comentariosExistentes[] = [
                    'origen' => 'Asesor',
                    'comentario' => $validated['comentario'],
                    'tipo' => 'devolucion_costeo_desde_cotizado',
                    'fecha' => now()->toISOString(),
                ];
                $pedido->comentario = $comentariosExistentes;

                // 3. Transitar
                $pedido->transitarA(PedidoEstado::En_Costeo);
                $pedido->save();

                // 4. Notificar al vendedor
                if ($vendedor = $pedido->user) {
                    $vendedor->notify(new SystemNotification(
                        'pedido_devuelto_costeo',
                        'Pedido #'.$pedido->id.' devuelto a Costeo',
                        'El pedido ha sido devuelto a costeo para recotizar: '.$validated['comentario'],
                        'pi-calculator',
                        'orange',
                        ['id' => $pedido->id]
                    ));
                }
            });

            return response()->json([
                'data' => new PedidoResource($pedido->fresh()),
                'message' => 'Pedido devuelto a costeo',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Devolver pedido al analista (desde En_Costeo o Cotizado a En_Analisis).
     * El vendedor/asesor devuelve el pedido porque necesita cambios en las referencias.
     * Si viene de Cotizado, anula la cotizacion activa primero.
     */
    public function devolverAAnalista(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'comentario' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        $estadoActual = $pedido->estado;
        $desdeCotizado = $estadoActual === PedidoEstado::Cotizado->value;
        $desdeCosteo = $estadoActual === PedidoEstado::En_Costeo->value;

        if (! $desdeCotizado && ! $desdeCosteo) {
            return response()->json([
                'message' => 'Solo los pedidos en estado Cotizado o En_Costeo pueden devolverse al analista.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($pedido, $validated, $request, $desdeCotizado) {
                // Si viene de Cotizado, anular cotizacion activa
                if ($desdeCotizado) {
                    $cotizacionService = app(CotizacionService::class);
                    $cotizacionService->anularCotizacionActiva($pedido, $validated['comentario']);
                }

                // Registrar comentario
                $comentariosExistentes = is_array($pedido->comentario) ? $pedido->comentario : [];
                $comentariosExistentes[] = [
                    'origen' => 'Asesor',
                    'comentario' => $validated['comentario'],
                    'tipo' => $desdeCotizado ? 'devolucion_analista_desde_cotizado' : 'devolucion_analista',
                    'fecha' => now()->toISOString(),
                ];
                $pedido->comentario = $comentariosExistentes;

                // Transitar
                $pedido->transitarA(PedidoEstado::En_Analisis);
                $pedido->save();

                // Notificar a los analistas
                $analistas = User::whereHas('roles', function ($q) {
                    $q->where('name', 'Analista');
                })->get();

                foreach ($analistas as $analista) {
                    $analista->notify(new SystemNotification(
                        'pedido_devuelto_analista',
                        'Pedido #'.$pedido->id.' devuelto a Análisis',
                        'El asesor '.$request->user()->name.' ha devuelto el pedido #'.$pedido->id.' para corrección de referencias: '.$validated['comentario'],
                        'pi-arrow-right',
                        'orange',
                        ['id' => $pedido->id]
                    ));
                }
            });

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
                $vendedor->notify(new SystemNotification(
                    'pedido_devuelto',
                    'Pedido #'.$pedido->id.' devuelto por analista',
                    'El analista ha devuelto el pedido para que completes la información: '.$validated['comentario'],
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
     * Aprobar o rechazar un pedido cotizado.
     *
     * Al aprobar:
     * - Transita pedido a Aprobado
     * - Marca cotizacion activa como Aprobada
     * - Crea Orden de Trabajo y Orden de Compra en transaccion
     *
     * Al rechazar:
     * - Transita pedido a Rechazado
     * - Marca cotizacion activa como Rechazada
     */
    public function responder(Request $request, Pedido $pedido): JsonResponse
    {
        $validated = $request->validate([
            'respuesta' => ['required', 'string', 'in:aprobar,rechazar'],
            'comentario' => ['nullable', 'string', 'max:500'],
        ]);

        $this->authorize('update', $pedido);

        if (! in_array($pedido->estado, [PedidoEstado::En_Costeo->value, PedidoEstado::Cotizado->value], true)) {
            return response()->json([
                'message' => 'Solo los pedidos en estado En Costeo o Cotizado pueden responderse.',
            ], 422);
        }

        try {
            $cotizacionService = app(CotizacionService::class);

            if ($validated['respuesta'] === 'aprobar') {
                $cotizacionService->aprobarDesdePedido($pedido, $validated['comentario'] ?? '');

                // Notificar al vendedor
                if ($vendedor = $pedido->user) {
                    $vendedor->notify(new SystemNotification(
                        'pedido_aprobado',
                        'Pedido #'.$pedido->id.' aprobado',
                        'El cliente ha aprobado la cotizacion. Se han generado la Orden de Trabajo y Orden de Compra.',
                        'pi-check-circle',
                        'green',
                        ['id' => $pedido->id]
                    ));
                }

                return response()->json([
                    'data' => new PedidoResource($pedido->fresh()),
                    'message' => 'Pedido aprobado. OT y OC generadas.',
                ]);
            } else {
                $cotizacionService->rechazarDesdePedido($pedido, $validated['comentario'] ?? '');

                // Notificar al vendedor
                if ($vendedor = $pedido->user) {
                    $vendedor->notify(new SystemNotification(
                        'pedido_rechazado',
                        'Pedido #'.$pedido->id.' rechazado',
                        'El cliente ha rechazado una cotizacion: '.($validated['comentario'] ?? 'Sin comentario'),
                        'pi-times-circle',
                        'red',
                        ['id' => $pedido->id]
                    ));
                }

                return response()->json([
                    'data' => new PedidoResource($pedido->fresh()),
                    'message' => 'Cotización rechazada. El pedido permanece disponible para costeo.',
                ]);
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            \Log::error('Error al responder pedido', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'pedido_id' => $pedido->id,
            ]);

            return response()->json([
                'message' => 'Error al procesar la respuesta del pedido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar como enviado (Aprobado -> Enviado).
     * Solo Logistica, Administrador y super_admin.
     */
    public function enviar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('enviar', $pedido);

        if ($pedido->estado !== PedidoEstado::Aprobado->value) {
            return response()->json([
                'message' => 'Solo los pedidos en estado Aprobado pueden marcarse como enviados.',
            ], 422);
        }

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
     * Marcar como entregado (Enviado -> Entregado).
     * Solo Logistica, Administrador y super_admin.
     */
    public function entregar(Request $request, Pedido $pedido): JsonResponse
    {
        $this->authorize('entregar', $pedido);

        if ($pedido->estado !== PedidoEstado::Enviado->value) {
            return response()->json([
                'message' => 'Solo los pedidos en estado Enviado pueden marcarse como entregados.',
            ], 422);
        }

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
            'referencias.*.proveedores.*.dias_entrega' => ['nullable', 'integer', 'min:0', 'required_if:referencias.*.proveedores.*.es_backorder,false'],
            'referencias.*.proveedores.*.es_backorder' => ['required_without:referencias.*.proveedores.*.dias_entrega', 'boolean'],
            'referencias.*.proveedores.*.costo_unidad' => ['required', 'numeric', 'min:0'],
            'referencias.*.proveedores.*.utilidad' => ['required', 'numeric', 'min:0'],
            'referencias.*.proveedores.*.cantidad' => ['required', 'integer', 'min:1'],
            'referencias.*.proveedores.*.seleccionado' => ['required', 'boolean'],
        ]);

        try {
            $missingFreightRate = false;
            $countryIdsSinFlete = [];

            DB::transaction(function () use ($pedido, $validated, &$missingFreightRate, &$countryIdsSinFlete) {
                foreach ($validated['referencias'] as $refData) {
                    $pedidoReferencia = $pedido->referencias()->findOrFail($refData['id']);

                    $proveedores = $refData['proveedores'] ?? [];

                    // Obtener IDs actuales en la base de datos
                    $currentIds = $pedidoReferencia->proveedores()->pluck('id')->toArray();

                    // Obtener IDs enviados que deben conservarse
                    $idsToKeep = collect($proveedores)
                        ->filter(fn ($p) => isset($p['id']) && $p['id'])
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->toArray();

                    // Determinar qué IDs deben ser eliminados
                    $idsToDelete = array_diff($currentIds, $idsToKeep);

                    if (! empty($idsToDelete)) {
                        $pedidoReferencia->proveedores()->whereIn('id', $idsToDelete)->delete();
                    }

                    foreach ($proveedores as $provData) {
                        $proveedorId = (int) $provData['proveedor_id'];
                        $ubicacion = $this->pedidoService->ubicacionDesdeProveedor($proveedorId);

                        $calcData = array_merge($provData, [
                            'ubicacion' => $ubicacion,
                            'proveedor_id' => $proveedorId,
                            'costo_unidad' => $provData['costo_unidad'],
                        ]);
                        $valores = $this->pedidoService->calcularValores($calcData, $pedidoReferencia);

                        if ($valores['missing_freight_rate'] ?? false) {
                            $missingFreightRate = true;
                            $tercero = Tercero::with('country')->find($proveedorId);
                            if ($tercero?->country_id) {
                                $countryIdsSinFlete[] = $tercero->country_id;
                            }
                        }

                        $updateData = [
                            'pedido_referencia_id' => $pedidoReferencia->id,
                            'referencia_id' => $pedidoReferencia->referencia_id,
                            'proveedor_id' => $provData['proveedor_id'],
                            'marca_id' => $provData['marca_id'] ?? null,
                            'dias_entrega' => ($provData['es_backorder'] ?? false) ? null : $provData['dias_entrega'],
                            'es_backorder' => $provData['es_backorder'] ?? false,
                            'costo_unidad' => $provData['costo_unidad'],
                            'utilidad' => $provData['utilidad'],
                            'cantidad' => $provData['cantidad'],
                            'ubicacion' => $ubicacion,
                            'valor_unidad' => $valores['valor_unidad'],
                            'valor_total' => $valores['valor_total'],
                            'estado' => $provData['seleccionado'] ? 1 : 0,
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
                        ->with(['referencia.marca', 'referencia.articulo.referencias.marca', 'referencia.articulo.medidas', 'referencia.articulo.piezaEstandar', 'referencia.articulo.articuloJuegos.referencia.articulo', 'referencia.articuloJuegos.articulo', 'sistema', 'lista', 'categoriaComercial', 'categoriasComerciales', 'marca', 'imagenes', 'proveedores.tercero']);
                },
                'articulos.articulo', 'articulos.sistema',
            ]);

            return response()->json([
                'message' => 'Costeo guardado exitosamente',
                'data' => new PedidoResource($pedido),
                'missing_freight_rate' => $missingFreightRate,
                'country_ids_sin_flete' => array_values(array_unique($countryIdsSinFlete)),
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

    /**
     * Notifica a los proveedores cuyas marcas/categorías coinciden con las referencias del pedido
     */
    private function notificarProveedoresCosteo(Pedido $pedido): void
    {
        $referencias = $pedido->referencias;
        $proveedoresANotificar = [];

        foreach ($referencias as $ref) {
            $categoriasComercialesIds = $ref->categoriasComerciales->pluck('id')->toArray();
            if ($ref->categoria_comercial_id) {
                $categoriasComercialesIds[] = $ref->categoria_comercial_id;
            }
            $categoriasComercialesIds = array_unique(array_filter($categoriasComercialesIds));

            $proveedores = Tercero::where('provider_access', true)
                ->whereHas('fabricantes', function ($q) use ($ref) {
                    $q->where('lista_id', $ref->marca_id);
                })
                ->whereHas('categoriasComerciales', function ($q) use ($categoriasComercialesIds) {
                    $q->whereIn('lista_id', $categoriasComercialesIds);
                })
                ->with('user')
                ->get();

            foreach ($proveedores as $prov) {
                if (! isset($proveedoresANotificar[$prov->id])) {
                    $proveedoresANotificar[$prov->id] = [
                        'tercero' => $prov,
                        'count' => 0,
                    ];
                }
                $proveedoresANotificar[$prov->id]['count']++;
            }
        }

        foreach ($proveedoresANotificar as $data) {
            $prov = $data['tercero'];
            $count = $data['count'];

            // 1. Notificación formal (Database + Broadcast) si tiene usuario vinculado
            if ($prov->user) {
                $prov->user->notify(new ProviderNewReferencesNotification($count, $pedido->id));
            }

            // 2. Broadcast directo al canal del tercero para widgets en tiempo real
            broadcast(new NewReferencesAvailable($prov->id, $count))->toOthers();
        }
    }

    /**
     * Toma ownership de pedidos de cliente o landing (sin vendedor asignado).
     */
    private function asignarPedidoExternoAlVendedor(Pedido $pedido, User $vendedor): void
    {
        if (! $pedido->esDeLanding()) {
            return;
        }

        if ($pedido->user_id === $vendedor->id) {
            return;
        }

        $pedido->user_id = $vendedor->id;
        $pedido->save();
    }
}
