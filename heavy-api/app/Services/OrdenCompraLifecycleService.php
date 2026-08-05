<?php

declare(strict_types=1);

namespace App\Services;

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

            if ($destino === OrdenCompraEstado::Enviada) {
                $updates['fecha_envio'] = $ordenCompra->fecha_envio ?? now();
            }

            if ($destino === OrdenCompraEstado::Confirmada) {
                $updates['fecha_confirmacion'] = $ordenCompra->fecha_confirmacion ?? now();
            }

            if ($destino === OrdenCompraEstado::Recibida) {
                $updates['fecha_recepcion'] = $ordenCompra->fecha_recepcion ?? now();
            }

            if ($destino === OrdenCompraEstado::Cancelada) {
                $updates['motivo_cancelacion'] = $data['motivo_cancelacion'] ?? null;
            }

            if ($destino === OrdenCompraEstado::Despachada) {
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

        if ($cantidadRecibida <= 0) {
            return $ordenCompra->refresh();
        }

        $destino = $cantidadConforme >= $cantidadOrdenada
            ? OrdenCompraEstado::Recibida
            : OrdenCompraEstado::RecibidaParcialmente;

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

        if ($destino === OrdenCompraEstado::Cancelada && blank($data['motivo_cancelacion'] ?? null)) {
            throw ValidationException::withMessages([
                'motivo_cancelacion' => 'El motivo de cancelación es obligatorio para este estado.',
            ]);
        }

        if ($destino === OrdenCompraEstado::Cancelada && $origen->requiereAprobacionAdminParaCancelar()) {
            $tieneAprobacion = (bool) ($data['aprobacion_admin'] ?? false);
            $esAdmin = $user?->hasAnyRole(['super_admin', 'Administrador']) ?? false;

            if (! $tieneAprobacion || ! $esAdmin) {
                throw ValidationException::withMessages([
                    'aprobacion_admin' => 'Cancelar una OC confirmada requiere aprobación de administrador.',
                ]);
            }
        }
    }
}
