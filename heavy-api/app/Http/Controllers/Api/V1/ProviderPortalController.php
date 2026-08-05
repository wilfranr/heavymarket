<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrdenCompraEstado;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProviderCosteoRequest;
use App\Http\Resources\OrdenCompraResource;
use App\Http\Resources\PedidoReferenciaResource;
use App\Models\OrdenCompra;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Tercero;
use App\Services\OrdenCompraLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para el Portal de Proveedores
 *
 * Gestiona el motor de emparejamiento de referencias y las operaciones
 * permitidas para los proveedores en el sistema.
 */
class ProviderPortalController extends Controller
{
    /**
     * Listar oportunidades de costeo (Matching Engine)
     *
     * Retorna las referencias de pedidos que coinciden con la especialidad
     * del proveedor autenticado y que aún no han sido costeadas por él.
     */
    public function opportunities(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Obtener el tercero asociado al usuario
            $tercero = Tercero::where('user_id', $user->id)->first();

            if (! $tercero) {
                return response()->json([
                    'message' => 'No se encontró un perfil de tercero asociado a su usuario.',
                ], 404);
            }

            // Obtener marcas y categorías del proveedor
            $misMarcas = $tercero->fabricantes()->pluck('lista_id')->toArray();
            $misCategorias = $tercero->categoriasComerciales()->pluck('lista_id')->toArray();

            $status = $request->input('status', 'pending');

            if ($status === 'sent' || $status === 'approved') {
                $dbStatus = $status === 'sent' ? 0 : 1;
                $query = PedidoReferenciaProveedor::query()
                    ->where('proveedor_id', $tercero->id)
                    ->where('estado', $dbStatus)
                    ->with([
                        'pedidoReferencia.referencia.marca',
                        'pedidoReferencia.referencia.articulo',
                        'pedidoReferencia.categoriaComercial',
                        'marca',
                        'pedidoReferencia.pedido.user',
                        'pedidoReferencia.pedido.maquina',
                    ])
                    ->orderBy('created_at', 'desc');

                $perPage = (int) $request->input('per_page', 15);
                $costeos = $query->paginate($perPage);

                $data = collect($costeos->items())->map(function ($costeo) {
                    $pedidoReferencia = $costeo->pedidoReferencia;
                    $pedido = $pedidoReferencia?->pedido;

                    return [
                        'id' => $costeo->pedido_referencia_id,
                        'pedido_id' => $pedidoReferencia?->pedido_id,
                        'costeo_proveedor_id' => $costeo->id,
                        'cantidad' => $costeo->cantidad,
                        'definicion' => $pedidoReferencia?->definicion ?? 'N/A',
                        'peso' => $pedidoReferencia?->referencia?->articulo?->peso ?? 0,
                        'referencia' => [
                            'referencia' => $pedidoReferencia?->referencia?->referencia ?? 'N/A',
                        ],
                        'categoria_comercial' => [
                            'nombre' => $pedidoReferencia?->categoriaComercial?->nombre ?? 'General',
                        ],
                        'marca' => [
                            'nombre' => $costeo->marca?->nombre ?? 'N/A',
                        ],
                        'pedido' => $pedido ? [
                            'id' => $pedido->id,
                            'estado' => $pedido->estado,
                            'created_at' => $pedido->created_at?->toISOString(),
                            'updated_at' => $pedido->updated_at?->toISOString(),
                            'user' => $pedido->user ? ['name' => $pedido->user->name] : null,
                            'maquina' => $pedido->maquina ? [
                                'tipo' => $pedido->maquina->tipo,
                                'marca' => $pedido->maquina->marca,
                                'modelo' => $pedido->maquina->modelo,
                                'serie' => $pedido->maquina->serie,
                                'id_interno' => $pedido->maquina->id_interno,
                            ] : null,
                        ] : null,
                        'form_costo' => $costeo->costo_unidad,
                        'form_dias_entrega' => $costeo->dias_entrega,
                        'form_es_backorder' => $costeo->es_backorder,
                        'form_comentario' => $costeo->comentario,
                        'form_marca_id' => $costeo->marca_id,
                        'form_cantidad_cotizada' => $costeo->cantidad,
                        'form_seleccionado' => true,
                        'submitting' => false,
                        'already_costed' => true,
                    ];
                });

                return response()->json([
                    'data' => $data,
                    'provider' => [
                        'id' => $tercero->id,
                        'nombre' => $tercero->nombre,
                        'is_national' => (int) $tercero->country_id === 48,
                    ],
                    'meta' => [
                        'current_page' => $costeos->currentPage(),
                        'last_page' => $costeos->lastPage(),
                        'per_page' => $costeos->perPage(),
                        'total' => $costeos->total(),
                    ],
                ]);
            }

            // Consulta de emparejamiento (Matching Engine) para status = pending
            $query = PedidoReferencia::query()
                ->whereHas('pedido', function ($q) {
                    $q->where('estado', 'En_Costeo');
                })
                ->where(function ($q) use ($misMarcas, $misCategorias) {
                    $q->whereIn('marca_id', $misMarcas)
                        ->orWhereIn('categoria_comercial_id', $misCategorias)
                        ->orWhereHas('categoriasComerciales', function ($sub) use ($misCategorias) {
                            $sub->whereIn('listas.id', $misCategorias);
                        });
                })
                // Excluir si ya fue costeado por este proveedor
                ->whereDoesntHave('proveedores', function ($q) use ($tercero) {
                    $q->where('proveedor_id', $tercero->id);
                });

            // Ordenamiento y Carga de relaciones
            $query->with(['referencia.marca', 'referencia.articulo', 'categoriaComercial', 'marca', 'pedido.user', 'pedido.maquina'])
                ->orderBy('created_at', 'desc');

            // Paginación
            $perPage = (int) $request->input('per_page', 15);
            $referencias = $query->paginate($perPage);

            return response()->json([
                'data' => PedidoReferenciaResource::collection($referencias)->response()->getData()->data,
                'provider' => [
                    'id' => $tercero->id,
                    'nombre' => $tercero->nombre,
                    'is_national' => (int) $tercero->country_id === 48,
                ],
                'meta' => [
                    'current_page' => $referencias->currentPage(),
                    'last_page' => $referencias->lastPage(),
                    'per_page' => $referencias->perPage(),
                    'total' => $referencias->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno al cargar oportunidades.',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Enviar oferta de costeo para una referencia
     *
     * Registra el precio, marca sugerida y tiempo de entrega propuesto
     * por el proveedor.
     */
    public function submitCost(StoreProviderCosteoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = $request->user();
            $tercero = Tercero::where('user_id', $user->id)->first();
            $validated = $request->validated();

            $pedidoReferencia = PedidoReferencia::findOrFail($validated['pedido_referencia_id']);
            $marcaId = $validated['marca_id'] ?? $pedidoReferencia->marca_id;
            $esBackorder = $validated['es_backorder'] ?? false;

            // Asociar automáticamente la marca al proveedor si no la tiene asociada
            if ($marcaId && ! $tercero->fabricantes()->where('lista_id', $marcaId)->exists()) {
                $tercero->fabricantes()->attach($marcaId);
            }

            // Crear el registro de costeo
            $costeo = PedidoReferenciaProveedor::create([
                'pedido_referencia_id' => $pedidoReferencia->id,
                'referencia_id' => $pedidoReferencia->referencia_id,
                'proveedor_id' => $tercero->id,
                'marca_id' => $marcaId,
                'costo_unidad' => $validated['costo_unidad'],
                'dias_entrega' => $esBackorder ? null : $validated['dias_entrega'],
                'es_backorder' => $esBackorder,
                'comentario' => $validated['comentario'] ?? null,
                'cantidad' => $pedidoReferencia->cantidad,
                'estado' => 0, // 0 = Pendiente de selección, 1 = Seleccionado por el asesor
                'utilidad' => 0.00, // Requerido en MySQL real, inicializado en cero
                'ubicacion' => (int) $tercero->country_id === 48 ? 'Nacional' : 'Internacional',
                'Entrega' => $esBackorder ? 'Backorder' : ((int) $validated['dias_entrega'] === 0 ? 'Inmediata' : 'Programada'),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Oferta de costeo enviada exitosamente.',
                'data' => $costeo,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al procesar la oferta de costeo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar Órdenes de Compra del proveedor
     */
    public function purchaseOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        $tercero = Tercero::where('user_id', $user->id)->first();

        if (! $tercero) {
            return response()->json(['message' => 'Perfil no encontrado'], 404);
        }

        $query = OrdenCompra::query()
            ->where('proveedor_id', $tercero->id)
            ->with(['tercero', 'transportadora', 'detalles.referencia'])
            ->orderBy('created_at', 'desc');

        $perPage = (int) $request->input('per_page', 15);
        $ordenes = $query->paginate($perPage);

        return response()->json([
            'data' => OrdenCompraResource::collection($ordenes),
            'meta' => [
                'current_page' => $ordenes->currentPage(),
                'last_page' => $ordenes->lastPage(),
                'per_page' => $ordenes->perPage(),
                'total' => $ordenes->total(),
            ],
        ]);
    }

    /**
     * Confirmar una OC desde el portal de proveedores.
     */
    public function confirmPurchaseOrder(Request $request, int $id, OrdenCompraLifecycleService $lifecycleService): JsonResponse
    {
        $validated = $request->validate([
            'observaciones' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $tercero = Tercero::where('user_id', $user->id)->first();

        if (! $tercero) {
            return response()->json(['message' => 'Perfil no encontrado'], 404);
        }

        $oc = OrdenCompra::where('proveedor_id', $tercero->id)->findOrFail($id);

        $ordenCompra = $lifecycleService->transicionar(
            $oc,
            OrdenCompraEstado::Confirmada,
            $validated,
            $user
        );

        return response()->json([
            'message' => 'Orden de compra confirmada correctamente.',
            'data' => new OrdenCompraResource($ordenCompra),
        ]);
    }

    /**
     * Actualizar datos de despacho de una OC
     */
    public function updateDispatch(Request $request, int $id, OrdenCompraLifecycleService $lifecycleService): JsonResponse
    {
        $validated = $request->validate([
            'guia' => ['required', 'string', 'max:100'],
            'transportadora_id' => ['required', 'integer', 'exists:transportadoras,id'],
            'fecha_despacho' => ['required', 'date'],
            'observaciones' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $tercero = Tercero::where('user_id', $user->id)->first();

        if (! $tercero) {
            return response()->json(['message' => 'Perfil no encontrado'], 404);
        }

        $oc = OrdenCompra::where('proveedor_id', $tercero->id)->findOrFail($id);

        $oc->update($validated);

        $ordenCompra = $lifecycleService->transicionar(
            $oc,
            OrdenCompraEstado::Despachada,
            [],
            $user
        );

        return response()->json([
            'message' => 'Despacho registrado correctamente.',
            'data' => new OrdenCompraResource($ordenCompra->load('transportadora')),
        ]);
    }
}
