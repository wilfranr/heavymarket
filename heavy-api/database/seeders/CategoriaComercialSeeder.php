<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lista;

/**
 * Seeder para categorías comerciales desde CSV
 * Completa las categorías que faltaban del issue #62
 */
class CategoriaComercialSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = base_path('../data/Categoria_comercial.csv');
        
        if (!file_exists($csvPath)) {
            $this->command->error("CSV no encontrado: $csvPath");
            return;
        }

        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle); // Skip header
        $count = 0;
        $created = 0;
        $updated = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $count++;
            $nombre = trim($row[0]);
            $descripcion = isset($row[1]) ? trim($row[1]) : null;
            $imagen = isset($row[2]) ? trim($row[2]) : null;

            // Normalizar nombre para búsqueda (mayúsculas, sin acentos)
            $nombreSearch = strtoupper($this->normalizar($nombre));

            // Buscar existente por nombre normalizado
            $existente = Lista::where('tipo', 'Categoría Comercial')
                ->whereRaw("REPLACE(UPPER(nombre), ' ','') = ?", [$nombreSearch])
                ->first();

            if ($existente) {
                // Actualizar si hay cambios
                if ($existente->definicion !== $descripcion || $existente->foto !== $imagen) {
                    $existente->update([
                        'definicion' => $descripcion,
                        'foto' => $imagen,
                    ]);
                    $updated++;
                    $this->command->info("Actualizado: {$existente->nombre}");
                }
            } else {
                // Crear nuevo
                Lista::create([
                    'tipo' => 'Categoría Comercial',
                    'nombre' => $nombre,
                    'definicion' => $descripcion,
                    'foto' => $imagen,
                ]);
                $created++;
                $this->command->info("Creado: $nombre");
            }
        }

        fclose($handle);
        $this->command->info("Total procesados: $count | Creados: $created | Actualizados: $updated");
    }

    private function normalizar(string $text): string
    {
        // Mayúsculas y sin espacios para comparación
        return strtoupper(preg_replace('/\s+/', '', $text));
    }
}