<?php

namespace Database\Seeders;

use App\Models\Articulo;
use App\Models\Lista;
use Illuminate\Database\Seeder;

class ImportPiezasToArticulosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creando Artículos a partir de Piezas Estándar...');

        $piezas = Lista::where('tipo', 'Piezas Estandar')->get();
        $creados = 0;
        $existentes = 0;

        foreach ($piezas as $pieza) {
            // Verificar si ya existe un artículo con esta definición
            $articulo = Articulo::firstOrCreate(
                ['definicion' => $pieza->nombre],
                [
                    'descripcionEspecifica' => $pieza->definicion,
                    'comentarios' => 'Generado automáticamente desde Piezas Estándar',
                    // Otros campos opcionales
                    // 'peso' => null,
                    // 'fotoDescriptiva' => $pieza->foto,
                ]
            );

            if ($articulo->wasRecentlyCreated) {
                $creados++;
            } else {
                $existentes++;
            }
        }

        $this->command->info("Proceso finalizado: $creados artículos creados, $existentes ya existían.");
    }
}
