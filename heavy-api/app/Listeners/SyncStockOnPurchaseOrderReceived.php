<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\PurchaseOrderItemsReceived;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use App\Models\StockMovement;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * Sincroniza el ledger de inventario (stock_movements) al confirmarse una
 * recepción de compra. Idempotente: el índice único de stock_movements
 * (origen_type, origen_id, referencia_id) rechaza la reinserción si el
 * evento se procesa más de una vez para el mismo detalle.
 *
 * Disponibilidad de una Referencia = SUM(entradas) - SUM(salidas) del ledger.
 */
class SyncStockOnPurchaseOrderReceived
{
    public function handle(PurchaseOrderItemsReceived $event): void
    {
        $recepcion = $event->recepcion;

        if (! $recepcion->estaActiva()) {
            return;
        }

        foreach ($recepcion->detalles as $detalle) {
            if ((int) $detalle->cantidad_conforme <= 0) {
                continue;
            }

            $this->registrarMovimiento($recepcion, $detalle);
        }
    }

    private function registrarMovimiento(RecepcionCompra $recepcion, RecepcionCompraDetalle $detalle): void
    {
        try {
            StockMovement::create([
                'referencia_id' => $detalle->ordenCompraDetalle->referencia_id,
                'cantidad' => $detalle->cantidad_conforme,
                'tipo_movimiento' => StockMovement::ENTRADA,
                'origen_type' => RecepcionCompraDetalle::class,
                'origen_id' => $detalle->id,
                'usuario_id' => $recepcion->recibido_por,
                'observaciones' => $recepcion->observaciones,
            ]);
        } catch (QueryException $exception) {
            if (! $this->esViolacionIndiceUnico($exception)) {
                throw $exception;
            }

            Log::info('StockMovement ya procesado previamente (idempotencia)', [
                'recepcion_compra_detalle_id' => $detalle->id,
            ]);
        }
    }

    private function esViolacionIndiceUnico(QueryException $exception): bool
    {
        return (int) ($exception->errorInfo[1] ?? 0) === 1062;
    }
}
