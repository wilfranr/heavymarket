<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\RecepcionCompra;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara después de confirmar (commit) una recepción de compra activa.
 * Único punto de integración con el módulo de inventario
 * (ver App\Listeners\SyncStockOnPurchaseOrderReceived).
 */
class PurchaseOrderItemsReceived implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly RecepcionCompra $recepcion,
    ) {}
}
