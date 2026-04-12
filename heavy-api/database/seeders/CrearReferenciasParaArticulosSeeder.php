<?php

namespace Database\Seeders;

use App\Models\Articulo;
use App\Models\Fabricante; // Ajustar a nombre real si es FAbricante o Marca
use App\Models\Referencia;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CrearReferenciasParaArticulosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Generando Referencias Ficticias para Artículos sin ellas...');

        // 1. Obtener fabricantes para hacer más realista
        $fabricantes = Fabricante::pluck('id')->toArray();
        if (empty($fabricantes)) {
            // Crear un fabricante genérico si no hay
            $fab = Fabricante::create(['nombre' => 'GENERICO', 'estado' => 'Activo']); // Asumiendo campos minimos
            $fabricantes[] = $fab->id;
        }

        // 2. Obtener Artículos sin referencias (o todos los recien creados)
        // Optimizacion: Procesar por chunks para no memoria
        $articulos = Articulo::whereDoesntHave('referencias')->get();
        // O mejor: where('comentarios', 'Generado automáticamente desde Piezas Estándar')

        $this->command->info("Se encontraron {$articulos->count()} artículos sin referencias.");

        $creadas = 0;

        foreach ($articulos as $articulo) {
            // Generar entre 1 y 3 referencias por artículo
            $cantidad = rand(1, 3);

            for ($i = 0; $i < $cantidad; $i++) {
                $codigo = strtoupper(substr($articulo->definicion, 0, 3)).'-'.rand(1000, 9999).'-'.Str::random(2);

                Referencia::create([
                    'referencia' => $codigo,
                    'articulo_id' => $articulo->id,
                    'marca_id' => $fabricantes[array_rand($fabricantes)],
                    'comentario' => 'Referencia generada automáticamente',
                ]);
                $creadas++;
            }
        }

        $this->command->info("¡Proceso completado! Se generaron $creadas referencias.");
    }
}
