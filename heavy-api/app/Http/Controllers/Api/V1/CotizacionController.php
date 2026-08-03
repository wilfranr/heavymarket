<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveCotizacionRequest;
use App\Http\Requests\StoreCotizacionRequest;
use App\Http\Requests\UpdateCotizacionRequest;
use App\Http\Resources\CotizacionResource;
use App\Models\Cotizacion;
use App\Models\Pedido;
use App\Models\PedidoReferenciaProveedor;
use App\Services\CotizacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Cotizaciones
 *
 * Maneja todas las operaciones CRUD de cotizaciones y
 * operaciones especiales como aprobar, rechazar y cálculos.
 */
class CotizacionController extends Controller
{
    public function __construct(
        private readonly CotizacionService $cotizacionService,
    ) {}

    /**
     * Listar todas las cotizaciones con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cotizacion::query()
            ->with(['pedido', 'tercero', 'user']);

        $user = $request->user();
        if ($user->hasRole('Analista')) {
            $query->whereHas('pedido', fn ($q) => $q->where('estado', 'En_Analisis'));
        } elseif (! $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])) {
            $query->whereHas('pedido', fn ($q) => $q->where('user_id', $user->id));
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        // Filtro por tercero
        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        // Filtro por pedido
        if ($request->filled('pedido_id')) {
            $query->where('pedido_id', $request->input('pedido_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $cotizaciones = $query->paginate($perPage);

        return response()->json([
            'data' => CotizacionResource::collection($cotizaciones->items()),
            'meta' => [
                'current_page' => $cotizaciones->currentPage(),
                'last_page' => $cotizaciones->lastPage(),
                'per_page' => $cotizaciones->perPage(),
                'total' => $cotizaciones->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva cotización
     */
    public function store(StoreCotizacionRequest $request): JsonResponse
    {
        try {
            $pedido = Pedido::findOrFail($request->input('pedido_id'));

            $cotizacion = $this->cotizacionService->crearDesdePedido(
                $pedido,
                ['user_id' => $request->user()->id]
            );

            return response()->json([
                'data' => $cotizacion,
                'message' => 'Cotización creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una cotización específica
     */
    public function show(Cotizacion $cotizacion): JsonResponse
    {
        $cotizacion->load([
            'pedido',
            'pedido.contacto',
            'pedido.maquina',
            'pedido.maquina.listas',
            'pedido.maquina.fabricante',
            'pedido.maquina.componentes.marca',
            'pedido.maquina.componentes.sistema',
            'pedido.fabricante',
            'pedido.referencias',
            'pedido.referencias.proveedores',
            'tercero',
            'user',
            'referenciasProveedores',
            'referenciasProveedores.pedidoReferenciaProveedor',
            'referenciasProveedores.pedidoReferenciaProveedor.referencia',
            'referenciasProveedores.pedidoReferenciaProveedor.marca',
            'referenciasProveedores.pedidoReferenciaProveedor.tercero',
        ]);

        // Calcular totales si no están calculados
        if (! $cotizacion->total) {
            $total = $this->cotizacionService->calcularPrecioTotal($cotizacion);
            $cotizacion->update(['total' => $total]);
        }

        $impuestos = $this->cotizacionService->calcularConImpuestos($cotizacion->total ?? 0);

        return response()->json([
            'data' => new CotizacionResource($cotizacion),
            'totales' => $impuestos,
        ]);
    }

    /**
     * Actualizar una cotización
     */
    public function update(UpdateCotizacionRequest $request, Cotizacion $cotizacion): JsonResponse
    {
        $validated = $request->validated();

        try {
            $cotizacion->update($validated);
            $cotizacion->refresh();
            $cotizacion->load(['pedido', 'tercero', 'user', 'referenciasProveedores']);

            return response()->json([
                'data' => new CotizacionResource($cotizacion),
                'message' => 'Cotización actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una cotización
     */
    public function destroy(Cotizacion $cotizacion): JsonResponse
    {
        try {
            $cotizacion->delete();

            return response()->json([
                'message' => 'Cotización eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar y descargar el PDF de la cotización
     */
    public function downloadPDF(Cotizacion $cotizacion)
    {
        try {
            $pdf = $this->cotizacionService->generarPDF($cotizacion);

            return $pdf->download("COT-{$cotizacion->id}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al generar el PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Finalizar costeo y crear cotización
     */
    public function finalizarCosteo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pedido_id' => ['required', 'exists:pedidos,id'],
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:pedido_referencia_proveedor,id'],
            'items.*.mostrar_referencia' => ['required', 'boolean'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $pedido = Pedido::findOrFail($validated['pedido_id']);

            $erroresCampos = $this->validarCamposItemsSeleccionados($validated['items']);
            if (! empty($erroresCampos)) {
                return response()->json([
                    'message' => 'Campos incompletos en los ítems seleccionados',
                    'errores' => $erroresCampos,
                ], 422);
            }

            $cotizacion = $this->cotizacionService->finalizarCosteo(
                $pedido,
                $validated['items'],
                $request->user()->id,
                $validated['observaciones'] ?? null
            );

            $esBorrador = $cotizacion->estado === 'Borrador';

            return response()->json([
                'data' => new CotizacionResource($cotizacion),
                'message' => $esBorrador
                    ? 'Cotización guardada en Borrador: falta configurar tarifa de flete para el país del proveedor.'
                    : 'Cotización generada exitosamente',
                'missing_freight_rate' => $esBorrador,
                'cotizacion_estado' => $cotizacion->estado,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al finalizar el costeo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aprobar una cotización
     */
    public function approve(ApproveCotizacionRequest $request, Cotizacion $cotizacion): JsonResponse
    {
        $validated = $request->validated();

        try {
            $cotizacion = $this->cotizacionService->aprobar(
                $cotizacion,
                '',
                $validated['referencia_ids'] ?? null
            );
            $cotizacion->load(['pedido', 'tercero', 'user']);

            return response()->json([
                'data' => new CotizacionResource($cotizacion),
                'message' => 'Cotización aprobada exitosamente',
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al aprobar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rechazar una cotización
     */
    public function reject(Request $request, Cotizacion $cotizacion): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $cotizacion = $this->cotizacionService->rechazar(
                $cotizacion,
                $validated['motivo'] ?? ''
            );
            $cotizacion->load(['pedido', 'tercero', 'user']);

            return response()->json([
                'data' => new CotizacionResource($cotizacion),
                'message' => 'Cotización rechazada exitosamente',
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al rechazar la cotización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validar que los items seleccionados tengan todos los campos requeridos
     *
     * @param  array<int, array{id: int, mostrar_referencia: bool}>  $items
     * @return array<int, string>
     */
    private function validarCamposItemsSeleccionados(array $items): array
    {
        $errores = [];

        foreach ($items as $item) {
            $prp = PedidoReferenciaProveedor::with([
                'pedidoReferencia.referencia.articulo',
                'tercero',
                'marca',
            ])->find($item['id']);

            if (! $prp) {
                continue;
            }

            $referenciaCodigo = $prp->pedidoReferencia?->referencia?->referencia ?? "ID {$prp->id}";
            $proveedorNombre = $prp->tercero?->nombre ?? "Proveedor ID {$prp->proveedor_id}";

            if (empty($prp->proveedor_id)) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Proveedor no seleccionado";
            }

            if (empty($prp->marca_id)) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Marca no seleccionada";
            }

            if (empty($prp->dias_entrega) && $prp->dias_entrega !== 0) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Tiempo de entrega no configurado";
            }

            if (! isset($prp->costo_unidad) || $prp->costo_unidad <= 0) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Costo no configurado";
            }

            if (! isset($prp->utilidad) || $prp->utilidad < 0) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Utilidad no configurada";
            }

            if (empty($prp->cantidad) || $prp->cantidad <= 0) {
                $errores[] = "[Ref: {$referenciaCodigo}, Proveedor: {$proveedorNombre}] Cantidad no válida";
            }
        }

        return $errores;
    }
}
