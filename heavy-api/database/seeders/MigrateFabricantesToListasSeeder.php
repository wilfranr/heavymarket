<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Fabricante;
use App\Models\Lista;
use Illuminate\Database\Seeder;

class MigrateFabricantesToListasSeeder extends Seeder
{
    public function run(): void
    {
        $count = 0;
        foreach (Fabricante::query()->cursor() as $fabricante) {
            Lista::syncFromFabricante($fabricante);
            $count++;
        }

        $this->command->info("Sincronizados {$count} fabricantes como listas tipo Fabricantes.");
    }
}
