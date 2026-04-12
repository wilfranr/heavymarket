<?php

namespace App\Console\Commands;

use App\Models\Lista;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanListaTagsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clean:lista-tags {--dry-run : Solo mostrar los cambios sin aplicarlos}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina las etiquetas entre <> de los nombres en la tabla lista para tipos de artículo';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $listas = Lista::where('tipo', 'Tipo de Artículo')
            ->where('nombre', 'like', '%<%')
            ->get();

        if ($listas->isEmpty()) {
            $this->info('No se encontraron registros con etiquetas para limpiar.');

            return 0;
        }

        $this->info("Encontrados {$listas->count()} registros para procesar.");
        if ($dryRun) {
            $this->warn('MODO SIMULACIÓN: No se realizarán cambios en la base de datos.');
        }

        $count = 0;

        DB::beginTransaction();
        try {
            foreach ($listas as $item) {
                $nombreOriginal = $item->nombre;

                // 1. Eliminar contenido entre <> incluyendo los brackets
                $nuevoNombre = preg_replace('/<[^>]*>/', '', $nombreOriginal);

                // 2. Normalizar espacios (eliminar espacios múltiples y trim)
                $nuevoNombre = trim(preg_replace('/\s+/', ' ', $nuevoNombre));

                if ($nombreOriginal !== $nuevoNombre) {
                    $this->line("Transformando: <comment>'{$nombreOriginal}'</comment> -> <info>'{$nuevoNombre}'</info>");

                    if (! $dryRun) {
                        $item->update(['nombre' => $nuevoNombre]);
                    }
                    $count++;
                }
            }

            if (! $dryRun) {
                DB::commit();
                $this->info("\nLimpieza completada. Se actualizaron {$count} registros.");
            } else {
                DB::rollBack();
                $this->info("\nSimulación completada. Se habrían actualizado {$count} registros.");
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("\nError durante el proceso: ".$e->getMessage());

            return 1;
        }

        return 0;
    }
}
