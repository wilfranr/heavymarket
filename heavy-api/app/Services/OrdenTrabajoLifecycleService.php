<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrdenTrabajoEstado;
use App\Events\OrdenTrabajoReferenciaActualizada;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use Illuminate\Support\Collection;

/**
 * Gobierna el progreso y el estado general de la Orden de Trabajo (OT) a
 * partir de lo que se va recibiendo en las Ordenes de Compra vinculadas, y
 * el cierre tecnico automatico cuando recibida + depurada == cotizada en
 * todas sus lineas (ver evaluarCompletitud()).
 */
class OrdenTrabajoLifecycleService
{
    private function esTerminal(?string $estado): bool
    {
        return OrdenTrabajoEstado::tryFrom((string) $estado)?->esTerminal() ?? false;
    }

    /**
     * Ubica la Orden de Trabajo operativa asociada a una Orden de Compra,
     * usando el mismo criterio que RecepcionCompraService::validarRelacionOperativa()
     * (misma pedido_id o misma cotizacion_id).
     */
    public function resolverDesdeOrdenCompra(OrdenCompra $ordenCompra): ?OrdenTrabajo
    {
        if ($ordenCompra->pedido_id === null && $ordenCompra->cotizacion_id === null) {
            return null;
        }

        return OrdenTrabajo::query()
            ->where(function ($query) use ($ordenCompra): void {
                if ($ordenCompra->pedido_id !== null) {
                    $query->orWhere('pedido_id', $ordenCompra->pedido_id);
                }

                if ($ordenCompra->cotizacion_id !== null) {
                    $query->orWhere('cotizacion_id', $ordenCompra->cotizacion_id);
                }
            })
            ->first();
    }

    /**
     * Sincroniza cantidad_recibida en orden_trabajo_referencias a partir de los
     * detalles de OC (orden_compra_referencia.id) que acaban de recibir una
     * recepcion, y recalcula el estado general de la OT.
     *
     * @param  Collection<int, int>  $ordenCompraDetalleIds
     */
    public function sincronizarProgresoPorRecepcion(OrdenTrabajo $ordenTrabajo, Collection $ordenCompraDetalleIds): OrdenTrabajo
    {
        $referenciaIds = OrdenCompraReferencia::query()
            ->whereIn('id', $ordenCompraDetalleIds)
            ->pluck('referencia_id')
            ->filter()
            ->unique();

        if ($referenciaIds->isEmpty()) {
            return $ordenTrabajo->refresh();
        }

        $referenciasOt = OrdenTrabajoReferencia::query()
            ->where('orden_trabajo_id', $ordenTrabajo->id)
            ->whereHas('pedidoReferencia', function ($query) use ($referenciaIds): void {
                $query->whereIn('referencia_id', $referenciaIds);
            })
            ->with('pedidoReferencia')
            ->get();

        foreach ($referenciasOt as $referenciaOt) {
            $this->sincronizarReferencia($ordenTrabajo, $referenciaOt);
        }

        $ordenTrabajo = $this->actualizarEstadoPorProgreso($ordenTrabajo->refresh());

        OrdenTrabajoReferenciaActualizada::dispatch($ordenTrabajo);

        return $ordenTrabajo;
    }

    private function sincronizarReferencia(OrdenTrabajo $ordenTrabajo, OrdenTrabajoReferencia $referenciaOt): void
    {
        $referenciaId = $referenciaOt->pedidoReferencia?->referencia_id;

        if ($referenciaId === null) {
            return;
        }

        $recibida = (int) RecepcionCompraDetalle::query()
            ->whereHas('ordenCompraDetalle', function ($query) use ($referenciaId): void {
                $query->where('referencia_id', $referenciaId);
            })
            ->whereHas('recepcionCompra', function ($query) use ($ordenTrabajo): void {
                $query->where('estado', RecepcionCompra::ESTADO_ACTIVA)
                    ->whereHas('ordenCompra', function ($ocQuery) use ($ordenTrabajo): void {
                        $ocQuery->where(function ($scope) use ($ordenTrabajo): void {
                            if ($ordenTrabajo->pedido_id !== null) {
                                $scope->orWhere('pedido_id', $ordenTrabajo->pedido_id);
                            }

                            if ($ordenTrabajo->cotizacion_id !== null) {
                                $scope->orWhere('cotizacion_id', $ordenTrabajo->cotizacion_id);
                            }
                        });
                    });
            })
            ->sum('cantidad_conforme');

        $cotizada = (int) $referenciaOt->cantidad_cotizada;

        // Un item ya depurado (issue de depuracion de faltantes) mantiene su
        // estado; este servicio no lo sobreescribe.
        if ($referenciaOt->estado === 'Cancelado') {
            $referenciaOt->update(['cantidad_recibida' => $recibida]);

            return;
        }

        $completa = $cotizada > 0 && $recibida >= $cotizada;

        $referenciaOt->update([
            'cantidad_recibida' => $recibida,
            'estado' => $completa ? 'Recibido' : 'Pendiente',
            'recibido' => $completa,
        ]);
    }

    /**
     * Recalcula el estado general de la OT segun el progreso acumulado.
     * No introduce el estado final "Completado"; eso depende tambien de la
     * depuracion de faltantes (ver issue 03 - cierre tecnico automatico).
     */
    public function actualizarEstadoPorProgreso(OrdenTrabajo $ordenTrabajo): OrdenTrabajo
    {
        // ListaParaFacturar solo lo asigna evaluarCompletitud(); este metodo
        // no debe revertirlo a En Proceso/Pendiente.
        if ($this->esTerminal($ordenTrabajo->estado) || $ordenTrabajo->estado === OrdenTrabajoEstado::ListaParaFacturar->value) {
            return $ordenTrabajo;
        }

        $totales = $ordenTrabajo->referencias()
            ->selectRaw('COALESCE(SUM(cantidad_cotizada), 0) as cotizado')
            ->selectRaw('COALESCE(SUM(cantidad_recibida), 0) as recibido')
            ->first();

        $cotizado = (int) ($totales->cotizado ?? 0);
        $recibido = (int) ($totales->recibido ?? 0);

        if ($cotizado <= 0) {
            return $ordenTrabajo;
        }

        $destino = $recibido > 0 ? OrdenTrabajoEstado::EnProceso : OrdenTrabajoEstado::Pendiente;

        if ($ordenTrabajo->estado !== $destino->value) {
            $ordenTrabajo->update(['estado' => $destino->value]);
        }

        return $ordenTrabajo->refresh();
    }

    /**
     * Evalua el cierre tecnico automatico: si recibida + depurada == cotizada
     * en todas las lineas, transiciona la OT a `Lista para Facturar`.
     * Idempotente: no genera cambios si ya esta en ese estado o en un estado
     * terminal (Completado/Cancelado).
     */
    public function evaluarCompletitud(OrdenTrabajo $ordenTrabajo): OrdenTrabajo
    {
        if ($this->esTerminal($ordenTrabajo->estado)) {
            return $ordenTrabajo;
        }

        $referencias = $ordenTrabajo->relationLoaded('referencias')
            ? $ordenTrabajo->referencias
            : $ordenTrabajo->referencias()->get();

        if ($referencias->isEmpty()) {
            return $ordenTrabajo;
        }

        $completa = $referencias->every(
            fn (OrdenTrabajoReferencia $referencia): bool => $this->lineaCumple($referencia)
        );

        if ($completa && $ordenTrabajo->estado !== OrdenTrabajoEstado::ListaParaFacturar->value) {
            $ordenTrabajo->update(['estado' => OrdenTrabajoEstado::ListaParaFacturar->value]);
        }

        return $ordenTrabajo->refresh();
    }

    /**
     * Detalle de completitud por linea, usado por el endpoint de solo
     * lectura GET /ordenes-trabajo/{id}/completitud.
     *
     * @return array{completa: bool, lineas: array<int, array{referencia_id: int, cotizada: int, recibida: int, depurada: int, cumple: bool}>}
     */
    public function detalleCompletitud(OrdenTrabajo $ordenTrabajo): array
    {
        $referencias = $ordenTrabajo->relationLoaded('referencias')
            ? $ordenTrabajo->referencias
            : $ordenTrabajo->referencias()->get();

        $lineas = $referencias->map(fn (OrdenTrabajoReferencia $referencia): array => [
            'referencia_id' => $referencia->id,
            'cotizada' => (int) $referencia->cantidad_cotizada,
            'recibida' => (int) $referencia->cantidad_recibida,
            'depurada' => (int) $referencia->cantidad_depurada,
            'cumple' => $this->lineaCumple($referencia),
        ])->values()->all();

        return [
            'completa' => $referencias->isNotEmpty() && $referencias->every(fn (OrdenTrabajoReferencia $referencia): bool => $this->lineaCumple($referencia)),
            'lineas' => $lineas,
        ];
    }

    private function lineaCumple(OrdenTrabajoReferencia $referencia): bool
    {
        return ((int) $referencia->cantidad_recibida + (int) $referencia->cantidad_depurada) === (int) $referencia->cantidad_cotizada;
    }

    /**
     * Progreso agregado de la OT, expuesto por OrdenTrabajoResource.
     *
     * @return array{cotizado: int, recibido: int, porcentaje: int}
     */
    public function calcularProgreso(OrdenTrabajo $ordenTrabajo): array
    {
        $referencias = $ordenTrabajo->relationLoaded('referencias')
            ? $ordenTrabajo->referencias
            : $ordenTrabajo->referencias()->get();

        $cotizado = (int) $referencias->sum('cantidad_cotizada');
        $recibido = (int) $referencias->sum('cantidad_recibida');

        return [
            'cotizado' => $cotizado,
            'recibido' => $recibido,
            'porcentaje' => $cotizado > 0 ? (int) round(min($recibido, $cotizado) / $cotizado * 100) : 0,
        ];
    }
}
