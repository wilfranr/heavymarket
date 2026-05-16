<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdenCompraRequest;
use App\Http\Requests\UpdateOrdenCompraRequest;
use App\Http\Resources\OrdenCompraResource;
use App\Models\Empresa;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Órdenes de Compra
 */
class OrdenCompraController extends Controller
{
    use AuthorizesRequests;

    /**
     * Listar todas las órdenes de compra
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', OrdenCompra::class);

        $query = OrdenCompra::query()
            ->with(['proveedor', 'detalles.referencia']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('proveedor_id')) {
            $query->where('proveedor_id', $request->input('proveedor_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('observaciones', 'like', "%{$search}%")
                    ->orWhere('guia', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%")
                    ->orWhereHas('proveedor', function ($q2) use ($search) {
                        $q2->where('nombre', 'like', "%{$search}%");
                    });
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
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
     * Crear una nueva orden de compra
     */
    public function store(StoreOrdenCompraRequest $request): JsonResponse
    {
        $this->authorize('create', OrdenCompra::class);

        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $ordenCompra = OrdenCompra::create([
                'proveedor_id' => $validated['proveedor_id'],
                'tercero_id' => $validated['tercero_id'] ?? null,
                'pedido_id' => $validated['pedido_id'] ?? null,
                'cotizacion_id' => $validated['cotizacion_id'] ?? null,
                'fecha_expedicion' => $validated['fecha_expedicion'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'] ?? 'Pendiente',
                'color' => $validated['color'] ?? '#FFFF00',
                'observaciones' => $validated['observaciones'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
                'telefono' => $validated['telefono'] ?? null,
                'guia' => $validated['guia'] ?? null,
            ]);

            // Agregar referencias si existen
            if (isset($validated['referencias']) && is_array($validated['referencias'])) {
                foreach ($validated['referencias'] as $referencia) {
                    OrdenCompraReferencia::create([
                        'orden_compra_id' => $ordenCompra->id,
                        'referencia_id' => $referencia['referencia_id'],
                        'cantidad' => $referencia['cantidad'],
                        'valor_unitario' => $referencia['valor_unitario'],
                        'valor_total' => $referencia['valor_total'],
                    ]);
                }
            }

            // Calcular totales
            $valorTotal = $ordenCompra->getTotalReferencias();
            $ordenCompra->update(['valor_total' => $valorTotal]);

            DB::commit();

            $ordenCompra->load(['proveedor', 'tercero', 'pedido', 'cotizacion', 'detalles.referencia']);

            return response()->json([
                'data' => new OrdenCompraResource($ordenCompra),
                'message' => 'Orden de compra creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una orden de compra específica
     */
    public function show(OrdenCompra $orden_compra): JsonResponse
    {
        $this->authorize('view', $orden_compra);

        $orden_compra->load([
            'proveedor',
            'tercero',
            'pedido',
            'cotizacion',
            'detalles.referencia',
        ]);

        return response()->json([
            'data' => new OrdenCompraResource($orden_compra),
        ]);
    }

    /**
     * Actualizar una orden de compra
     */
    public function update(UpdateOrdenCompraRequest $request, OrdenCompra $orden_compra): JsonResponse
    {
        $this->authorize('update', $orden_compra);

        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $orden_compra->update($validated);

            // Actualizar referencias SOLO si se proporcionan explícitamente
            if (array_key_exists('referencias', $validated) && is_array($validated['referencias'])) {
                // Eliminar existentes
                OrdenCompraReferencia::where('orden_compra_id', $orden_compra->id)->delete();

                foreach ($validated['referencias'] as $ref) {
                    OrdenCompraReferencia::create([
                        'orden_compra_id' => $orden_compra->id,
                        'referencia_id' => $ref['referencia_id'],
                        'cantidad' => $ref['cantidad'],
                        'valor_unitario' => $ref['valor_unitario'],
                        'valor_total' => $ref['valor_total'],
                    ]);
                }

                // Recalcular total
                $valorTotal = $orden_compra->getTotalReferencias();
                $orden_compra->update(['valor_total' => $valorTotal]);
            }

            DB::commit();

            $orden_compra->load(['proveedor', 'tercero', 'pedido', 'cotizacion', 'detalles.referencia']);

            return response()->json([
                'data' => new OrdenCompraResource($orden_compra),
                'message' => 'Orden de compra actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una orden de compra
     */
    public function destroy(OrdenCompra $orden_compra): JsonResponse
    {
        $this->authorize('delete', $orden_compra);

        try {
            // Eliminar detalles primero
            OrdenCompraReferencia::where('orden_compra_id', $orden_compra->id)->delete();

            // Eliminar la orden
            $orden_compra->delete();

            return response()->json([
                'message' => 'Orden de compra eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la orden de compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar y descargar PDF de la orden de compra
     */
    public function downloadPDF(OrdenCompra $orden_compra)
    {
        $this->authorize('view', $orden_compra);

        $orden_compra->load([
            'proveedor.city',
            'tercero',
            'pedido',
            'cotizacion',
            'detalles.referencia.articulo',
        ]);

        $empresa = Empresa::where('siglas', 'HM')->first() ?? Empresa::where('id', 2)->first() ?? Empresa::first();

        $pdf = Pdf::loadView('pdf.orden_compra', [
            'ordenCompra' => $orden_compra,
            'empresa' => $empresa,
        ]);

        return $pdf->download("OC-{$orden_compra->id}.pdf");
    }
}
