<?php

namespace Database\Seeders;

use App\Models\CategoriaLanding;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class CategoriasLandingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $json = file_get_contents(__DIR__.'/categorias_data.json');
        $data = json_decode($json, true);

        CategoriaLanding::unguard();

        CategoriaLanding::withoutEvents(function () use ($data) {
            foreach ($data as $item) {
                CategoriaLanding::updateOrCreate(
                    ['id' => $item['id']],
                    Arr::only($item, [
                        'nombre',
                        'descripcion_general',
                        'mostrar_en_navbar',
                        'orden_navbar',
                    ])
                );
            }
        });

        CategoriaLanding::reguard();
    }
}
