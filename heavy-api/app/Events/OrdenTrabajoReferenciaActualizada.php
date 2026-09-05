<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\OrdenTrabajo;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara despues de confirmar (commit) un cambio en las cantidades de
 * una referencia de la Orden de Trabajo (recepcion o depuracion). Punto
 * unico de entrada para recalcular la completitud tecnica de la OT
 * (ver App\Listeners\RecalcularCompletitudOrdenTrabajo).
 */
class OrdenTrabajoReferenciaActualizada implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly OrdenTrabajo $ordenTrabajo,
    ) {}
}
