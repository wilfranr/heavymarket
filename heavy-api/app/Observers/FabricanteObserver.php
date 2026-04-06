<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Fabricante;
use App\Models\Lista;

class FabricanteObserver
{
    public function saved(Fabricante $fabricante): void
    {
        Lista::syncFromFabricante($fabricante);
    }

    public function deleted(Fabricante $fabricante): void
    {
        Lista::query()
            ->where('tipo', 'Fabricantes')
            ->where('fabricante_id', $fabricante->id)
            ->delete();
    }
}
