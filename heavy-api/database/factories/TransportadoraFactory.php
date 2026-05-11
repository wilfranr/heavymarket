<?php

namespace Database\Factories;

use App\Models\Transportadora;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transportadora>
 */
class TransportadoraFactory extends Factory
{
    protected $model = Transportadora::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->company(),
            'nit' => $this->faker->unique()->numerify('#########-#'),
            'telefono' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'direccion' => $this->faker->address(),
            'estado' => 'Activo',
        ];
    }
}
