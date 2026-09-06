<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\EstadoRecepcion;
use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrdenCompraLifecycleService
{
    /**
     * Estados de OC en los que tiene sentido informar un estado de recepción.
     *
     * @var array<int, OrdenCompraEstado>
     */
    private const ESTADOS_RECEPCIONABLES = [
        OrdenCompraEstado::Enviada,
        OrdenCompraEstado::Confirmada,
        OrdenCompraEstado::Despachada,
        OrdenCompraEstado::EnTransito,
        OrdenCompraEstado::RecibidaParcialmente,
        OrdenCompraEstado::RecepcionConNovedades,
        OrdenCompraEstado::Recibida,
        OrdenCompraEstado::EntregadaCerrada,
    ];

    /**
     * Campo informativo derivado de orden_compra_referencia.cantidad_recibida.
     * No muta el ciclo de vida formal de la OC (ver actualizarEstadoPorRecepciones).
     */
    public function calcularEstadoRecepcion(OrdenCompra $ordenCompra): ?EstadoRecepcion
    {
        $estado = OrdenCompraEstado::tryFrom((string) $ordenCompra->estado);

        if (! $estado || ! in_array($estado, self::ESTADOS_RECEPCIONABLES, true)) {
            return null;
        }

        $detalles = $ordenCompra->relationLoaded('detalles')
            ? $ordenCompra->detalles
            : $ordenCompra->detalles()->get();

        $cantidadOrdenada = (int) $detalles->sum('cantidad');

        if ($cantidadOrdenada <= 0) {
            return null;
        }

        $cantidadRecibida = (int) $detalles->sum('cantidad_recibida');

        return EstadoRecepcion::desdeCantidades($cantidadRecibida, $cantidadOrdenada);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function transicionar(OrdenCompra $ordenCompra, OrdenCompraEstado $destino, array $data = [], ?User $user = null): OrdenCompra
    {
        return DB::transaction(function () use ($ordenCompra, $destino, $data, $user): OrdenCompra {
            $origen = $this->estadoActual($ordenCompra);

            $this->validarTransicion($origen, $destino, $data, $user);

            $updates = [
                'estado' => $destino->value,
                'color' => $destino->color(),
            ];

            if ($destino === OrdenCompraEstado::Enviada || $destino === OrdenCompraEstado::PendienteRevisionStock) {
                $updates['fecha_envio'] = $ordenCompra->fecha_envio ?? now();
                if (isset($data['instrucciones_despacho'])) {
                    $updates['instrucciones_despacho'] = $data['instrucciones_despacho'];
                }
            }

            if ($destino === OrdenCompraEstado::Confirmada || $destino === OrdenCompraEstado::EnEsperaAprobacionGerencial) {
                $updates['fecha_confirmacion'] = $ordenCompra->fecha_confirmacion ?? now();
            }

            if ($destino === OrdenCompraEstado::DevueltaPorGerencia) {
                $updates['motivo_rechazo_gerencia'] = $data['motivo_rechazo_gerencia'] ?? null;
            }

            if ($destino === OrdenCompraEstado::PendienteDePago) {
                $updates['fecha_aprobacion_gerencia'] = now();
                if ($user) {
                    $updates['aprobado_por_gerente_id'] = $user->id;
                }
            }

            if ($destino === OrdenCompraEstado::Pagada || $destino === OrdenCompraEstado::PagadaListaDespacho) {
                $updates['fecha_pago'] = $ordenCompra->fecha_pago ?? now();
                if ($user && empty($ordenCompra->pagado_por_id)) {
                    $updates['pagado_por_id'] = $user->id;
                }
                if (isset($data['referencia_pago'])) {
                    $updates['referencia_pago'] = $data['referencia_pago'];
                }
                if (isset($data['comprobante_pago_ruta'])) {
                    $updates['comprobante_pago_ruta'] = $data['comprobante_pago_ruta'];
                }
            }

            if ($destino === OrdenCompraEstado::Recibida || $destino === OrdenCompraEstado::EntregadaCerrada) {
                $updates['fecha_recepcion'] = $ordenCompra->fecha_recepcion ?? now();
            }

            if ($origen === OrdenCompraEstado::RecepcionConNovedades && in_array($destino, [OrdenCompraEstado::PagadaListaDespacho, OrdenCompraEstado::EntregadaCerrada], true)) {
                $updates['resolucion_novedad_tipo'] = $data['resolucion_novedad_tipo'] ?? ($destino === OrdenCompraEstado::PagadaListaDespacho ? 'reposicion' : 'nota_credito');
                $updates['resolucion_novedad_comentario'] = $data['resolucion_novedad_comentario'] ?? null;
                $updates['fecha_resolucion_novedad'] = now();
                if ($user) {
                    $updates['resuelto_por_id'] = $user->id;
                }
            }

            if ($destino === OrdenCompraEstado::Cancelada) {
                $updates['motivo_cancelacion'] = $data['motivo_cancelacion'] ?? null;
            }

            if ($destino === OrdenCompraEstado::CanceladaReembolsoPendiente) {
                $updates['motivo_reembolso'] = $data['motivo_reembolso'] ?? $data['motivo_cancelacion'] ?? null;
                $updates['motivo_cancelacion'] = $updates['motivo_reembolso'];
            }

            if ($destino === OrdenCompraEstado::Despachada || $destino === OrdenCompraEstado::EnTransito) {
                $updates['fecha_despacho'] = $ordenCompra->fecha_despacho ?? now();
            }

            if (array_key_exists('observaciones', $data)) {
                $updates['observaciones'] = $data['observaciones'];
            }

            $ordenCompra->update($updates);

            return $ordenCompra->refresh()->load(['proveedor', 'tercero', 'pedido', 'cotizacion', 'detalles.referencia']);
        });
    }

    /**
     * @deprecated La recepción de compra se registra vía RecepcionCompraService
     * (registrarDesdeOrdenCompra / registrarDesdeOrdenTrabajo). Este stub queda
     * obsoleto y se elimina en una limpieza posterior.
     *
     * @param  array<string, mixed>  $data
     */
    public function recibir(OrdenCompra $ordenCompra, array $data = []): OrdenCompra
    {
        throw ValidationException::withMessages([
            'recepcion' => 'La recepción de compra debe registrarse desde la Orden de Trabajo.',
        ]);
    }

    public function actualizarEstadoPorRecepciones(OrdenCompra $ordenCompra): OrdenCompra
    {
        $origen = $this->estadoActual($ordenCompra);

        if (in_array($origen, [OrdenCompraEstado::Cancelada], true)) {
            return $ordenCompra->refresh();
        }

        $detalleIds = $ordenCompra->detalles()->pluck('id');
        $cantidadOrdenada = (int) $ordenCompra->detalles()->sum('cantidad');

        if ($cantidadOrdenada <= 0 || $detalleIds->isEmpty()) {
            return $ordenCompra->refresh();
        }

        $acumulados = RecepcionCompraDetalle::query()
            ->whereIn('orden_compra_detalle_id', $detalleIds)
            ->whereHas('recepcionCompra', function ($query): void {
                $query->where('estado', RecepcionCompra::ESTADO_ACTIVA);
            })
            ->selectRaw('COALESCE(SUM(cantidad_recibida), 0) as recibida')
            ->selectRaw('COALESCE(SUM(cantidad_conforme), 0) as conforme')
            ->first();

        $cantidadRecibida = (int) ($acumulados?->recibida ?? 0);
        $cantidadConforme = (int) ($acumulados?->conforme ?? 0);
        $cantidadRechazada = (int) RecepcionCompraDetalle::query()
            ->whereIn('orden_compra_detalle_id', $detalleIds)
            ->whereHas('recepcionCompra', function ($query): void {
                $query->where('estado', RecepcionCompra::ESTADO_ACTIVA);
            })
            ->sum('cantidad_rechazada');

        if ($cantidadRecibida <= 0) {
            return $ordenCompra->refresh();
        }

        $esCicloFormal = in_array($origen, [
            OrdenCompraEstado::EnTransito,
            OrdenCompraEstado::RecepcionConNovedades,
            OrdenCompraEstado::EntregadaCerrada,
            OrdenCompraEstado::PagadaListaDespacho,
        ], true);

        if ($esCicloFormal) {
            if ($cantidadRechazada > 0) {
                $destino = OrdenCompraEstado::RecepcionConNovedades;
            } elseif ($cantidadConforme >= $cantidadOrdenada) {
                $destino = OrdenCompraEstado::EntregadaCerrada;
            } else {
                $destino = OrdenCompraEstado::RecibidaParcialmente;
            }
        } else {
            if ($cantidadConforme >= $cantidadOrdenada) {
                $destino = OrdenCompraEstado::Recibida;
            } else {
                $destino = OrdenCompraEstado::RecibidaParcialmente;
            }
        }

        if ($origen === $destino) {
            return $ordenCompra->refresh()->load(['proveedor', 'tercero', 'pedido', 'cotizacion', 'detalles.referencia']);
        }

        $ordenCompra->update([
            'estado' => $destino->value,
            'color' => $destino->color(),
            'fecha_recepcion' => $ordenCompra->fecha_recepcion ?? now(),
        ]);

        return $ordenCompra->refresh()->load(['proveedor', 'tercero', 'pedido', 'cotizacion', 'detalles.referencia']);
    }

    private function estadoActual(OrdenCompra $ordenCompra): OrdenCompraEstado
    {
        $estado = OrdenCompraEstado::tryFrom((string) $ordenCompra->estado);

        if (! $estado) {
            throw ValidationException::withMessages([
                'estado' => 'La orden de compra tiene un estado no reconocido.',
            ]);
        }

        return $estado;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validarTransicion(OrdenCompraEstado $origen, OrdenCompraEstado $destino, array $data, ?User $user): void
    {
        if (! $origen->puedeTransitarA($destino)) {
            throw ValidationException::withMessages([
                'estado_destino' => "No se puede transitar de {$origen->value} a {$destino->value}.",
            ]);
        }

        if ($destino === OrdenCompraEstado::PendienteRevisionStock && blank($data['instrucciones_despacho'] ?? null)) {
            throw ValidationException::withMessages([
                'instrucciones_despacho' => 'Las instrucciones de despacho son obligatorias para enviar la orden a revisión del proveedor.',
            ]);
        }

        if ($destino->requiereMotivoCancelacion() && blank($data['motivo_cancelacion'] ?? $data['motivo_reembolso'] ?? null)) {
            throw ValidationException::withMessages([
                'motivo_cancelacion' => 'El motivo de cancelación o reembolso es obligatorio para este estado.',
            ]);
        }

        if ($destino === OrdenCompraEstado::DevueltaPorGerencia && blank($data['motivo_rechazo_gerencia'] ?? null)) {
            throw ValidationException::withMessages([
                'motivo_rechazo_gerencia' => 'El motivo de rechazo gerencial es obligatorio para devolver la orden.',
            ]);
        }

        if ($origen === OrdenCompraEstado::RecepcionConNovedades
            && in_array($destino, [OrdenCompraEstado::PagadaListaDespacho, OrdenCompraEstado::EntregadaCerrada], true)
            && blank($data['resolucion_novedad_comentario'] ?? null)) {
            throw ValidationException::withMessages([
                'resolucion_novedad_comentario' => 'El comentario de resolución de la novedad es obligatorio.',
            ]);
        }

        if ($destino === OrdenCompraEstado::Cancelada && $origen->requiereAprobacionAdminParaCancelar()) {
            $tieneAprobacion = (bool) ($data['aprobacion_admin'] ?? false);
            $esAdmin = $user?->hasAnyRole(['super_admin', 'Administrador', 'Gerente Comercial']) ?? false;

            if (! $tieneAprobacion || ! $esAdmin) {
                throw ValidationException::withMessages([
                    'aprobacion_admin' => 'Cancelar una OC en este estado requiere aprobación administrativa o gerencial.',
                ]);
            }
        }
    }
}
