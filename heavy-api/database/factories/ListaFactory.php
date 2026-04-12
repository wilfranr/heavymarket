<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Lista;
use App\Models\Sistema;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListaFactory extends Factory
{
    protected $model = Lista::class;

    public function definition(): array
    {
        return [
            'tipo' => 'Tipo de Máquina',
            'nombre' => fake()->unique()->word().' '.fake()->randomNumber(2),
            'definicion' => fake()->optional()->sentence(),
            'foto' => null,
            'fotoMedida' => null,
            'sistema_id' => null,
            'parent_id' => null,
            'fabricante_id' => null,
        ];
    }

    /**
     * Indicate that this is a Fabricante.
     */
    public function fabricante(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo' => 'Fabricantes',
            'nombre' => fake()->company(),
            'definicion' => fake()->optional()->sentence(),
        ]);
    }

    /**
     * Indicate that this is a Tipo de Máquina.
     */
    public function tipoMaquina(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo' => 'Tipo de Máquina',
            'nombre' => fake()->unique()->word().' '.fake()->randomNumber(2),
        ]);
    }

    /**
     * Indicate that this is a Sistema.
     */
    public function sistema(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo' => 'Sistemas',
            'nombre' => fake()->unique()->word(),
        ]);
    }

    /**
     * Indicate that this is a Categoría.
     */
    public function categoria(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo' => 'Categoría',
            'nombre' => fake()->unique()->word(),
        ]);
    }

    /**
     * Create with a parent relationship.
     */
    public function withParent(Lista $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Create with sistema relationship.
     */
    public function withSistema(Sistema $sistema): static
    {
        return $this->state(fn (array $attributes) => [
            'sistema_id' => $sistema->id,
        ]);
    }
}
