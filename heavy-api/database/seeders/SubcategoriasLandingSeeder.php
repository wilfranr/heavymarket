<?php

namespace Database\Seeders;

use App\Models\SubcategoriaLanding;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class SubcategoriasLandingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $path = __DIR__.'/subcategorias_data.json';

        if (! file_exists($path)) {
            $this->command->error("File not found: $path");

            return;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error('JSON Decode Error: '.json_last_error_msg());

            return;
        }

        if (empty($data)) {
            $this->command->error('Data is empty.');

            return;
        }

        $count = count($data);
        $this->command->info("Found {$count} records to process.");

        SubcategoriaLanding::unguard();

        try {
            SubcategoriaLanding::withoutEvents(function () use ($data) {
                foreach ($data as $item) {
                    SubcategoriaLanding::updateOrCreate(
                        ['id' => $item['id']],
                        Arr::only($item, [
                            'categoria_id',
                            'nombre',
                            'descripcion',
                            'imagen',
                            'mostrar_en_navbar',
                            'orden_navbar',
                        ])
                    );
                }
            });
            $this->command->info("Processed {$count} records successfully.");
        } catch (\Exception $e) {
            $this->command->error('Error during processing: '.$e->getMessage());
        }

        SubcategoriaLanding::reguard();
    }
}
