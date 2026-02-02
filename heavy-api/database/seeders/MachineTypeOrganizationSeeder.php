<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lista;

class MachineTypeOrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prefixMap = [
            'Const' => 'Construcción',
            'EqLig' => 'Equipo Ligero',
            'Miner' => 'Minería',
            'Pavim' => 'Pavimentación',
            'Tunel' => 'Subterráneo',
            'Util'  => 'Utilitarios',
        ];

        // 1. Asegurar que las categorías existan en la tabla listas
        $categoryModels = [];
        foreach ($prefixMap as $prefix => $nombre) {
            $category = Lista::updateOrCreate(
                ['tipo' => 'Categoría de Máquina', 'nombre' => $nombre],
                ['definicion' => "Categoría para maquinaria de {$nombre}"]
            );
            $categoryModels[$prefix] = $category;
        }

        // Categoría por defecto
        $defaultCategory = Lista::updateOrCreate(
            ['tipo' => 'Categoría de Máquina', 'nombre' => 'Otros'],
            ['definicion' => 'Otras categorías de maquinaria']
        );

        // 2. Organizar los "Tipos de Máquina" existentes
        $machineTypes = Lista::where('tipo', 'Tipo de Máquina')->get();

        foreach ($machineTypes as $item) {
            $prefixFound = null;

            if ($item->foto) {
                // Obtenemos el nombre del archivo sin la ruta de la carpeta
                $filename = basename($item->foto);
                $parts = explode('_', $filename);
                
                if (count($parts) > 0 && isset($prefixMap[$parts[0]])) {
                    $prefixFound = $parts[0];
                }
            }

            if ($prefixFound) {
                $item->parent_id = $categoryModels[$prefixFound]->id;
            } else {
                $item->parent_id = $defaultCategory->id;
            }

            $item->save();
        }

        $this->command->info('Tipos de máquina organizados por categoría exitosamente.');
    }
}
