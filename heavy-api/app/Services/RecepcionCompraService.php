<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrdenCompraEstado;
use App\Events\PurchaseOrderItemsReceived;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use App\Models\RecepcionCompraImagen;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecepcionCompraService
{
    public function __construct(
        private readonly OrdenCompraLifecycleService $ordenCompraLifecycleService,
        private readonly OrdenTrabajoLifecycleService $ordenTrabajoLifecycleService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function registrarDesdeOrdenTrabajo(OrdenTrabajo $ordenTrabajo, array $data, User $usuario): RecepcionCompra
    {
        return DB::transaction(function () use ($ordenTrabajo, $data, $usuario): RecepcionCompra {
            $ordenCompra = OrdenCompra::query()
                ->with('detalles')
                ->findOrFail((int) $data['orden_compra_id']);

            $this->validarRelacionOperativa($ordenTrabajo, $ordenCompra);
            $this->validarEstadoRecepcionable($ordenCompra);

            $detallesPayload = collect($data['detalles'] ?? []);
            $this->validarDetallesDuplicados($detallesPayload->pluck('orden_compra_detalle_id')->all());
            $this->validarSaldoConforme($ordenCompra, $detallesPayload->all());

            $recepcion = $this->crearRecepcionConDetalles($ordenTrabajo, $ordenCompra, $data, $usuario, $detallesPayload);

            return $recepcion->refresh()->load([
                'ordenTrabajo',
                'ordenCompra.proveedor',
                'recibidoPor',
                'detalles.ordenCompraDetalle.referencia',
            ]);
        });
    }

    /**
     * Registra una recepción directamente desde la Orden de Compra, sin exigir
     * una Orden de Trabajo asociada. Soporta múltiples entregas parciales.
     *
     * @param  array<string, mixed>  $data
     */
    public function registrarDesdeOrdenCompra(OrdenCompra $ordenCompra, array $data, User $usuario): RecepcionCompra
    {
        return DB::transaction(function () use ($ordenCompra, $data, $usuario): RecepcionCompra {
            $ordenCompra = OrdenCompra::query()
                ->with('detalles')
                ->findOrFail($ordenCompra->id);

            $this->validarEstadoRecepcionable($ordenCompra);

            $detallesPayload = collect($data['detalles'] ?? []);
            $this->validarDetallesDuplicados($detallesPayload->pluck('orden_compra_detalle_id')->all());
            $this->validarSaldoConforme($ordenCompra, $detallesPayload->all());

            $recepcion = $this->crearRecepcionConDetalles(null, $ordenCompra, $data, $usuario, $detallesPayload);

            return $recepcion->refresh()->load([
                'ordenCompra.proveedor',
                'recibidoPor',
                'detalles.ordenCompraDetalle.referencia',
                'imagenes',
            ]);
        });
    }

    /**
     * Adjunta una foto o guía de transportadora a una recepción de compra
     * activa. Solo se persisten metadatos + ruta relativa; el archivo físico
     * vive en storage/app/public/recepciones/{recepcion_id}/.
     */
    public function storeImagen(RecepcionCompra $recepcion, UploadedFile $archivo, string $tipo, ?User $usuario): RecepcionCompraImagen
    {
        if (! $recepcion->estaActiva()) {
            throw ValidationException::withMessages([
                'recepcion' => 'No se pueden adjuntar imágenes a una recepción anulada.',
            ]);
        }

        $ruta = $archivo->store("recepciones/{$recepcion->id}", 'public');

        return RecepcionCompraImagen::create([
            'recepcion_compra_id' => $recepcion->id,
            'ruta' => $ruta,
            'nombre_original' => $archivo->getClientOriginalName(),
            'mime' => $archivo->getMimeType(),
            'size' => $archivo->getSize(),
            'tipo' => $tipo,
            'creado_por' => $usuario?->id,
        ]);
    }

    /**
     * Núcleo común de creación de recepción + detalles, compartido por ambas
     * entradas (Orden de Trabajo y Orden de Compra). Mantiene sincronizado el
     * acumulador orden_compra_referencia.cantidad_recibida y la transición de
     * estado formal de la OC dentro de la misma transacción.
     *
     * @param  array<string, mixed>  $data
     * @param  Collection<int, array<string, mixed>>  $detallesPayload
     */
    private function crearRecepcionConDetalles(
        ?OrdenTrabajo $ordenTrabajo,
        OrdenCompra $ordenCompra,
        array $data,
        User $usuario,
        Collection $detallesPayload,
    ): RecepcionCompra {
        $recepcion = RecepcionCompra::create([
            'orden_trabajo_id' => $ordenTrabajo?->id,
            'orden_compra_id' => $ordenCompra->id,
            'recibido_por' => $usuario->id,
            'fecha_recepcion' => $data['fecha_recepcion'],
            'numero_remision' => $data['numero_remision'] ?? null,
            'observaciones' => $data['observaciones'] ?? null,
            'estado' => RecepcionCompra::ESTADO_ACTIVA,
        ]);

        foreach ($detallesPayload as $detallePayload) {
            RecepcionCompraDetalle::create([
                'recepcion_compra_id' => $recepcion->id,
                'orden_compra_detalle_id' => (int) $detallePayload['orden_compra_detalle_id'],
                'cantidad_recibida' => (int) $detallePayload['cantidad_recibida'],
                'cantidad_conforme' => (int) $detallePayload['cantidad_conforme'],
                'cantidad_rechazada' => (int) $detallePayload['cantidad_rechazada'],
                'motivo_rechazo' => $detallePayload['motivo_rechazo'] ?? null,
            ]);
        }

        $detalleIds = $detallesPayload->pluck('orden_compra_detalle_id')->map(fn ($id) => (int) $id)->unique();

        $this->sincronizarAcumuladorCantidadRecibida($detalleIds);

        $this->ordenCompraLifecycleService->actualizarEstadoPorRecepciones($ordenCompra);

        $ordenTrabajoObjetivo = $ordenTrabajo ?? $this->ordenTrabajoLifecycleService->resolverDesdeOrdenCompra($ordenCompra);

        if ($ordenTrabajoObjetivo) {
            $this->ordenTrabajoLifecycleService->sincronizarProgresoPorRecepcion($ordenTrabajoObjetivo, $detalleIds);
        }

        $recepcion->load(['detalles.ordenCompraDetalle.referencia', 'ordenCompra', 'recibidoPor']);

        PurchaseOrderItemsReceived::dispatch($recepcion);

        return $recepcion;
    }

    /**
     * @param  Collection<int, int>  $detalleIds
     */
    private function sincronizarAcumuladorCantidadRecibida(Collection $detalleIds): void
    {
        foreach ($detalleIds as $detalleId) {
            $conforme = (int) RecepcionCompraDetalle::query()
                ->where('orden_compra_detalle_id', $detalleId)
                ->whereHas('recepcionCompra', function ($query): void {
                    $query->where('estado', RecepcionCompra::ESTADO_ACTIVA);
                })
                ->sum('cantidad_conforme');

            OrdenCompraReferencia::whereKey($detalleId)->update(['cantidad_recibida' => $conforme]);
        }
    }

    private function validarRelacionOperativa(OrdenTrabajo $ordenTrabajo, OrdenCompra $ordenCompra): void
    {
        $mismoPedido = $ordenTrabajo->pedido_id !== null
            && $ordenCompra->pedido_id !== null
            && (int) $ordenTrabajo->pedido_id === (int) $ordenCompra->pedido_id;

        $mismaCotizacion = $ordenTrabajo->cotizacion_id !== null
            && $ordenCompra->cotizacion_id !== null
            && (int) $ordenTrabajo->cotizacion_id === (int) $ordenCompra->cotizacion_id;

        if (! $mismoPedido && ! $mismaCotizacion) {
            throw ValidationException::withMessages([
                'orden_compra_id' => 'La orden de compra no pertenece al flujo operativo de esta orden de trabajo.',
            ]);
        }
    }

    private function validarEstadoRecepcionable(OrdenCompra $ordenCompra): void
    {
        $estado = OrdenCompraEstado::tryFrom((string) $ordenCompra->estado);

        if (! in_array($estado, [
            OrdenCompraEstado::Enviada,
            OrdenCompraEstado::Confirmada,
            OrdenCompraEstado::Despachada,
            OrdenCompraEstado::EnTransito,
            OrdenCompraEstado::RecibidaParcialmente,
            OrdenCompraEstado::RecepcionConNovedades,
        ], true)) {
            throw ValidationException::withMessages([
                'orden_compra_id' => 'La orden de compra no está en un estado válido para registrar recepción.',
            ]);
        }
    }

    /**
     * @param  array<int, mixed>  $detalleIds
     */
    private function validarDetallesDuplicados(array $detalleIds): void
    {
        $normalizados = array_map('intval', $detalleIds);

        if (count($normalizados) !== count(array_unique($normalizados))) {
            throw ValidationException::withMessages([
                'detalles' => 'No se puede registrar la misma línea de orden de compra más de una vez en una recepción.',
            ]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $detallesPayload
     */
    private function validarSaldoConforme(OrdenCompra $ordenCompra, array $detallesPayload): void
    {
        $detalles = OrdenCompraReferencia::query()
            ->where('orden_compra_id', $ordenCompra->id)
            ->whereIn('id', collect($detallesPayload)->pluck('orden_compra_detalle_id'))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($detallesPayload as $detallePayload) {
            $detalleId = (int) $detallePayload['orden_compra_detalle_id'];
            $detalle = $detalles->get($detalleId);

            if (! $detalle) {
                throw ValidationException::withMessages([
                    'detalles' => 'Una de las líneas no pertenece a la orden de compra indicada.',
                ]);
            }

            $conformeActual = (int) RecepcionCompraDetalle::query()
                ->where('orden_compra_detalle_id', $detalleId)
                ->whereHas('recepcionCompra', function ($query): void {
                    $query->where('estado', RecepcionCompra::ESTADO_ACTIVA);
                })
                ->sum('cantidad_conforme');

            $conformeNueva = (int) $detallePayload['cantidad_conforme'];

            if ($conformeActual + $conformeNueva > (int) $detalle->cantidad) {
                throw ValidationException::withMessages([
                    'detalles' => 'La cantidad conforme acumulada no puede superar la cantidad ordenada.',
                ]);
            }
        }
    }
}
