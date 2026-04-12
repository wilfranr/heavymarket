<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Tercero;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tercero>
 */
class TerceroFactory extends Factory
{
    protected $model = Tercero::class;

    public function definition(): array
    {
        $tipo = fake()->randomElement(['Cliente', 'Proveedor', 'Ambos']);
        $tipoDocumento = fake()->randomElement(['NIT', 'CC', 'CE', 'Pasaporte']);

        return [
            'tipo_documento' => $tipoDocumento,
            'numero_documento' => fake()->unique()->numerify('9#########'),
            'nombre' => fake()->company(),
            'tipo' => $tipo,
            'email' => fake()->optional()->safeEmail(),
            'telefono' => fake()->optional()->numerify('60# ### ####'),
            'direccion' => fake()->optional()->address(),
            'estado' => fake()->randomElement(['Activo', 'Inactivo']),
        ];
    }
}
