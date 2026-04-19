<?php

namespace Database\Factories;

use App\Models\Articulo;
use Illuminate\Database\Eloquent\Factories\Factory;

class ArticuloFactory extends Factory
{
    protected $model = Articulo::class;

    public function definition(): array
    {
        return [
            'definicion' => $this->faker->words(3, true),
            'descripcionEspecifica' => $this->faker->sentence(),
            'comentarios' => $this->faker->optional()->paragraph(),
            'peso' => $this->faker->optional()->randomFloat(2, 0.1, 100),
            'fotoDescriptiva' => null,
            'foto_medida' => null,
        ];
    }

    /**
     * Estado para artículos que son piezas estándar
     */
    public function piezaEstandar(): static
    {
        return $this->state(fn (array $attributes) => [
            'comentarios' => 'Generado automáticamente desde Piezas Estándar',
        ]);
    }
}
