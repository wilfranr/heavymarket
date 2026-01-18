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
        $tipoTercero = fake()->randomElement(['Natural', 'Juridico']);
        $tipoDocumento = $tipoTercero === 'Natural' 
            ? fake()->randomElement(['CC', 'CE', 'Pasaporte'])
            : 'NIT';

        return [
            'tipo_documento' => $tipoDocumento,
            'documento' => $tipoDocumento === 'NIT' 
                ? fake()->numerify('9########-#')
                : fake()->numerify('##########'),
            'razon_social' => $tipoTercero === 'Natural'
                ? fake()->name()
                : fake()->company(),
            'nombre_comercial' => fake()->optional()->company(),
            'tipo_tercero' => $tipoTercero,
            'email' => fake()->optional()->safeEmail(),
            'telefono' => fake()->optional()->numerify('60# ### ####'),
            'celular' => fake()->optional()->numerify('3## ### ####'),
            'direccion' => fake()->optional()->address(),
            'ciudad' => fake()->optional()->city(),
            'pais' => 'Colombia',
            'es_cliente' => fake()->boolean(70),
            'es_proveedor' => fake()->boolean(30),
            'estado' => fake()->randomElement(['Activo', 'Inactivo']),
        ];
    }
}
