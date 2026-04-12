<?php

namespace App\Console\Commands;

use App\Models\Lista;
use Illuminate\Console\Command;

class ImportPiezasEstandar extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:piezas {file=piezas.csv}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa piezas estándar desde un archivo CSV en storage/app';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $fileName = $this->argument('file');
        $filePath = storage_path('app/'.$fileName);

        if (! file_exists($filePath)) {
            $this->error("El archivo no existe en: $filePath");

            return;
        }

        $this->info("Iniciando importación desde $fileName...");

        if (($handle = fopen($filePath, 'r')) !== false) {
            $header = fgetcsv($handle, 1000, ','); // Leer cabecera
            $count = 0;
            $updated = 0;

            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                // Mapeo: 0 => NOMBRE, 1 => DESCRIPCION, 2 => IMAGEN
                // Ajustar si el CSV tiene otro orden
                $nombre = trim($data[0] ?? '');
                $descripcion = trim($data[1] ?? '');
                $imagen = trim($data[2] ?? '');

                if (empty($nombre)) {
                    continue;
                }

                Lista::updateOrCreate(
                    [
                        'tipo' => 'Piezas Estandar',
                        'nombre' => $nombre,
                    ],
                    [
                        'definicion' => $descripcion,
                        'foto' => $imagen,
                        // 'sistema_id' => null, // Opcional, según lógica de negocio
                    ]
                );

                $count++;
                if ($count % 50 == 0) {
                    $this->line("Procesados $count registros...");
                }
            }
            fclose($handle);
            $this->info("¡Importación completada! Total: $count registros procesados.");
        } else {
            $this->error('No se pudo abrir el archivo.');
        }
    }
}
