<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrdenTrabajoEstado;
use App\Http\Controllers\Controller;
use App\Http\Requests\DepurarOrdenTrabajoReferenciaRequest;
use App\Http\Requests\FacturarOrdenTrabajoRequest;
use App\Http\Requests\StoreOrdenTrabajoRequest;
use App\Http\Requests\StoreRecepcionCompraRequest;
use App\Http\Resources\OrdenTrabajoReferenciaResource;
use App\Http\Resources\OrdenTrabajoResource;
use App\Http\Resources\RecepcionCompraResource;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Services\CotizacionService;
use App\Services\OrdenTrabajoDepuracionService;
use App\Services\OrdenTrabajoFacturacionService;
use App\Services\OrdenTrabajoLifecycleService;
use App\Services\RecepcionCompraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Controlador API para gestion de Ordenes de Trabajo
 */
class OrdenTrabajoController extends Controller
{
    public function __construct(
        private readonly CotizacionService $cotizacionService,
        private readonly RecepcionCompraService $recepcionCompraService,
        private readonly OrdenTrabajoDepuracionService $ordenTrabajoDepuracionService,
        private readonly OrdenTrabajoLifecycleService $ordenTrabajoLifecycleService,
        private readonly OrdenTrabajoFacturacionService $ordenTrabajoFacturacionService,
    ) {}

    /**
     * Listar todas las ordenes de trabajo
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrdenTrabajo::query()
            ->with(['tercero', 'pedido.maquina', 'pedido.fabricante', 'pedido.tercero.city', 'pedido.contacto', 'cotizacion', 'transportadora', 'direccion', 'user', 'referencias.pedidoReferencia.proveedores.marca']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        if ($request->filled('pedido_id')) {
            $query->where('pedido_id', $request->input('pedido_id'));
        }

        if ($request->filled('transportadora_id')) {
            $query->where('transportadora_id', $request->input('transportadora_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $ordenes = $query->paginate($perPage);

        return response()->json([
            'data' => OrdenTrabajoResource::collection($ordenes->items()),
            'meta' => [
                'current_page' => $ordenes->currentPage(),
                'last_page' => $ordenes->lastPage(),
                'per_page' => $ordenes->perPage(),
                'total' => $ordenes->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva orden de trabajo
     */
    public function store(StoreOrdenTrabajoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $orden_trabajo = OrdenTrabajo::create([
                'user_id' => $request->user()->id,
                'tercero_id' => $validated['tercero_id'] ?? null,
                'pedido_id' => $validated['pedido_id'] ?? null,
                'cotizacion_id' => $validated['cotizacion_id'] ?? null,
                'estado' => $validated['estado'] ?? 'Pendiente',
                'fecha_ingreso' => $validated['fecha_ingreso'],
                'fecha_entrega' => $validated['fecha_entrega'] ?? null,
                'direccion_id' => $validated['direccion_id'] ?? null,
                'telefono' => $validated['telefono'],
                'observaciones' => $validated['observaciones'] ?? null,
                'guia' => $validated['guia'] ?? null,
                'transportadora_id' => $validated['transportadora_id'] ?? null,
                'archivo' => $validated['archivo'] ?? null,
                'motivo_cancelacion' => $validated['motivo_cancelacion'] ?? null,
            ]);

            DB::commit();

            $orden_trabajo->load([
                'tercero',
                'pedido',
                'cotizacion',
                'transportadora',
                'direccion',
                'user',
                'referencias',
            ]);

            return response()->json([
                'data' => new OrdenTrabajoResource($orden_trabajo),
                'message' => 'Orden de trabajo creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una orden de trabajo específica
     */
    public function show(OrdenTrabajo $orden_trabajo): JsonResponse
    {
        $orden_trabajo->load([
            'tercero',
            'pedido.maquina',
            'pedido.fabricante',
            'pedido.tercero.city',
            'pedido.contacto',
            'cotizacion',
            'transportadora',
            'direccion',
            'user',
            'referencias.pedidoReferencia.proveedores.marca',
            'recepcionesCompra.detalles.ordenCompraDetalle.referencia',
            'recepcionesCompra.ordenCompra.proveedor',
            'recepcionesCompra.recibidoPor',
            'referencias.referencia',
        ]);

        return response()->json([
            'data' => new OrdenTrabajoResource($orden_trabajo),
        ]);
    }

    /**
     * Detalle de cumplimiento por linea (recibida + depurada == cotizada),
     * usado para explicar por que una OT si o no esta lista para facturar.
     */
    public function completitud(OrdenTrabajo $orden_trabajo): JsonResponse
    {
        $orden_trabajo->load('referencias');

        return response()->json(
            $this->ordenTrabajoLifecycleService->detalleCompletitud($orden_trabajo)
        );
    }

    public function registrarRecepcionCompra(StoreRecepcionCompraRequest $request, OrdenTrabajo $orden_trabajo): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])
            && ! $user->roles()->whereIn('name', ['super_admin', 'Administrador', 'Logistica'])->exists()) {
            abort(403, 'No está autorizado para registrar recepciones de compra.');
        }

        try {
            $recepcion = $this->recepcionCompraService->registrarDesdeOrdenTrabajo(
                $orden_trabajo,
                $request->validated(),
                $user
            );

            return response()->json([
                'data' => new RecepcionCompraResource($recepcion),
                'message' => 'Recepción de compra registrada exitosamente',
            ], 201);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            abort(500, 'Error al registrar la recepción de compra: '.$exception->getMessage());
        }
    }

    /**
     * Actualizar una orden de trabajo
     */
    public function update(Request $request, OrdenTrabajo $orden_trabajo): JsonResponse
    {
        $rules = [
            'estado' => [
                'sometimes',
                'string',
                Rule::in(OrdenTrabajoEstado::asignablesManualmente()),
            ],
            'fecha_ingreso' => ['sometimes', 'date'],
            'fecha_entrega' => ['nullable', 'date'],
            'direccion_id' => ['nullable', 'integer', 'exists:direcciones,id'],
            'telefono' => ['sometimes', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'guia' => ['nullable', 'string', 'max:255'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'archivo' => ['nullable', 'string', 'max:255'],
            'motivo_cancelacion' => ['nullable', 'string', 'max:500'],
        ];

        // Si viene fecha_entrega pero no fecha_ingreso, no validar after_or_equal
        if ($request->filled('fecha_entrega') && ! $request->filled('fecha_ingreso')) {
            unset($rules['fecha_entrega'][2]); // Remove 'after_or_equal' rule
        }

        $validated = $request->validate($rules);

        try {
            if (! empty($validated)) {
                $orden_trabajo->update($validated);
            }

            $orden_trabajo->load([
                'tercero',
                'pedido',
                'cotizacion',
                'transportadora',
                'direccion',
                'user',
                'referencias',
            ]);

            return response()->json([
                'data' => new OrdenTrabajoResource($orden_trabajo),
                'message' => 'Orden de trabajo actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Depurar (marcar como faltante definitivo) una referencia de la orden.
     */
    public function depurarReferencia(
        DepurarOrdenTrabajoReferenciaRequest $request,
        OrdenTrabajo $orden_trabajo,
        OrdenTrabajoReferencia $orden_trabajo_referencia
    ): JsonResponse {
        if ((int) $orden_trabajo_referencia->orden_trabajo_id !== (int) $orden_trabajo->id) {
            abort(404, 'La referencia indicada no pertenece a esta orden de trabajo.');
        }

        try {
            $referencia = $this->ordenTrabajoDepuracionService->depurarFaltante(
                $orden_trabajo_referencia,
                $request->validated(),
                $request->user()
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            abort(500, 'Error al depurar el ítem: '.$exception->getMessage());
        }

        return response()->json([
            'data' => new OrdenTrabajoReferenciaResource($referencia->load(['pedidoReferencia', 'depuradoPor'])),
            'message' => 'Ítem depurado exitosamente',
        ]);
    }

    /**
     * Resumen de lo facturable (excluye lo depurado del total a cobrar).
     */
    public function resumenFacturacion(Request $request, OrdenTrabajo $orden_trabajo): JsonResponse
    {
        if (! $request->user()?->can('facturar', $orden_trabajo)) {
            abort(403, 'No está autorizado para ver el resumen de facturación.');
        }

        return response()->json(
            $this->ordenTrabajoFacturacionService->resumenFacturable($orden_trabajo)
        );
    }

    /**
     * Facturar (cerrar comercialmente) la orden de trabajo.
     */
    public function facturar(FacturarOrdenTrabajoRequest $request, OrdenTrabajo $orden_trabajo): JsonResponse
    {
        try {
            $orden_trabajo = $this->ordenTrabajoFacturacionService->facturar(
                $orden_trabajo,
                $request->validated(),
                $request->user()
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            abort(500, 'Error al facturar la orden de trabajo: '.$exception->getMessage());
        }

        return response()->json([
            'data' => new OrdenTrabajoResource($orden_trabajo),
            'message' => 'Orden de trabajo facturada exitosamente',
        ]);
    }

    /**
     * Eliminar una orden de trabajo
     */
    public function destroy(OrdenTrabajo $orden_trabajo): JsonResponse
    {
        try {
            // Eliminar referencias primero
            $orden_trabajo->referencias()->delete();

            $orden_trabajo->delete();

            return response()->json([
                'message' => 'Orden de trabajo eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la orden de trabajo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar y descargar el PDF de la orden de trabajo
     */
    public function downloadPDF(OrdenTrabajo $orden_trabajo)
    {
        try {
            $pdf = $this->cotizacionService->generarPDFOrdenTrabajo($orden_trabajo);

            return $pdf->download("OT-{$orden_trabajo->id}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al generar el PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
