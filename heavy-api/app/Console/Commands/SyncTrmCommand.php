<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SyncTrmCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trm:sync {date? : Fecha en formato Y-m-d para sincronizar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza la TRM desde la API de Socrata (datos.gov.co)';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\TrmIntegrationService $trmService)
    {
        $date = $this->argument('date');

        if ($date) {
            $this->info("Sincronizando TRM para la fecha: {$date}...");
            $trm = $trmService->syncByDate($date);
        } else {
            $this->info("Sincronizando la última TRM disponible...");
            $trm = $trmService->syncLatestTrm();
        }

        if ($trm) {
            $this->info("✅ TRM sincronizada exitosamente: {$trm->fecha->format('Y-m-d')} = \${$trm->trm}");
            
            // Opcional: Actualizar también el valor en la tabla Empresa si se desea
            $empresa = \App\Models\Empresa::where('estado', 1)->first();
            if ($empresa) {
                $empresa->update(['trm' => $trm->trm]);
                $this->info("✅ TRM de la empresa activa actualizada.");
            }
            
            return 0;
        }

        $this->error("❌ No se pudo sincronizar la TRM.");
        return 1;
    }
}
