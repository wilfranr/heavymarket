<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\SubcategoriaLanding;
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
        $json = file_get_contents(__DIR__ . '/subcategorias_data.json');
        $data = json_decode($json, true);

        SubcategoriaLanding::unguard();

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
                        'orden_navbar'
                    ])
                );
            }
        });

        SubcategoriaLanding::reguard();
    }
}
