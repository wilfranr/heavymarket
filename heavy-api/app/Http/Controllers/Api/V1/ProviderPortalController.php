<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProviderCosteoRequest;
use App\Http\Resources\OrdenCompraResource;
use App\Http\Resources\PedidoReferenciaResource;
use App\Models\OrdenCompra;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Tercero;
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

            // Consulta de emparejamiento (Matching Engine)
            $query = PedidoReferencia::query()
                ->whereHas('pedido', function ($q) {
                    $q->where('estado', 'En_Costeo');
                })
                ->where(function ($q) use ($misMarcas, $misCategorias) {
                    $q->whereIn('marca_id', $misMarcas)
                      ->orWhereIn('categoria_comercial_id', $misCategorias);
                })
                // Excluir si ya fue costeado por este proveedor
                ->whereDoesntHave('proveedores', function ($q) use ($tercero) {
                    $q->where('proveedor_id', $tercero->id);
                });

            // Ordenamiento y Carga de relaciones
            $query->with(['referencia.marca', 'categoriaComercial', 'marca', 'pedido'])
                ->orderBy('created_at', 'desc');

            // Paginación
            $perPage = (int) $request->input('per_page', 15);
            $referencias = $query->paginate($perPage);

            return response()->json([
                'data' => PedidoReferenciaResource::collection($referencias)->response()->getData()->data,
                'provider' => [
                    'id' => $tercero->id,
                    'nombre' => $tercero->nombre,
                    'is_national' => (int) $tercero->country_id === 48
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
                'trace' => $e->getTraceAsString()
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

            // Crear el registro de costeo
            $costeo = PedidoReferenciaProveedor::create([
                'pedido_referencia_id' => $pedidoReferencia->id,
                'referencia_id' => $pedidoReferencia->referencia_id,
                'proveedor_id' => $tercero->id,
                'marca_id' => $validated['marca_id'] ?? $pedidoReferencia->marca_id,
                'costo_unidad' => $validated['costo_unidad'],
                'dias_entrega' => $validated['dias_entrega'],
                'comentario' => $validated['comentario'] ?? null,
                'cantidad' => $pedidoReferencia->cantidad,
                'estado' => 'Pendiente', // Pendiente de ser elegido por el asesor
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
     * Actualizar datos de despacho de una OC
     */
    public function updateDispatch(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'guia' => ['required', 'string', 'max:100'],
            'transportadora_id' => ['required', 'integer', 'exists:transportadoras,id'],
            'fecha_despacho' => ['required', 'date'],
            'observaciones' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $tercero = Tercero::where('user_id', $user->id)->first();

        $oc = OrdenCompra::where('proveedor_id', $tercero->id)->findOrFail($id);

        $oc->update(array_merge($validated, [
            'estado' => 'Despachado',
        ]));

        return response()->json([
            'message' => 'Despacho registrado correctamente.',
            'data' => new OrdenCompraResource($oc->load('transportadora')),
        ]);
    }
}
