<?php

namespace Database\Seeders;

use App\Models\Sistema;
use Illuminate\Database\Seeder;

class DefaultSystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Sistema::updateOrCreate(
            ['nombre' => 'Por defecto'],
            [
                'descripcion' => 'Sistema general para todos los tipos de artículos',
                'imagen' => 'default.png',
            ]
        );
    }
}
