<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrdenTrabajoReferenciaActualizada;
use App\Services\OrdenTrabajoLifecycleService;

/**
 * Recalcula si la Orden de Trabajo cumple la formula de cierre tecnico
 * (recibida + depurada == cotizada en todas sus lineas) y la transiciona
 * a `Lista para Facturar` cuando corresponde.
 */
class RecalcularCompletitudOrdenTrabajo
{
    public function __construct(
        private readonly OrdenTrabajoLifecycleService $ordenTrabajoLifecycleService,
    ) {}

    public function handle(OrdenTrabajoReferenciaActualizada $event): void
    {
        $this->ordenTrabajoLifecycleService->evaluarCompletitud($event->ordenTrabajo);
    }
}
