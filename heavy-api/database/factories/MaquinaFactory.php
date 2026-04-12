<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Lista;
use App\Models\Maquina;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaquinaFactory extends Factory
{
    protected $model = Maquina::class;

    public function definition(): array
    {
        return [
            'tipo' => Lista::factory()->tipoMaquina(),
            'modelo' => fake()->word().' '.fake()->randomNumber(3),
            'fabricante_id' => Lista::factory()->fabricante(),
            'serie' => fake()->unique()->uuid(),
            'arreglo' => fake()->optional()->sentence(),
            'foto' => null,
            'fotoId' => null,
            'estado_revision' => 'por_revisar',
        ];
    }

    /**
     * Indicate that the machine has been reviewed.
     */
    public function revisada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado_revision' => 'revisado',
        ]);
    }

    /**
     * Indicate that the machine has a photo.
     */
    public function withFoto(): static
    {
        return $this->state(fn (array $attributes) => [
            'foto' => 'maquinas/'.fake()->uuid().'.jpg',
        ]);
    }

    /**
     * Indicate that the machine has an ID photo.
     */
    public function withFotoId(): static
    {
        return $this->state(fn (array $attributes) => [
            'fotoId' => 'maquinas/ids/'.fake()->uuid().'.jpg',
        ]);
    }

    /**
     * Create with specific tipo (Lista).
     */
    public function withTipo(Lista $tipo): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo' => $tipo->id,
        ]);
    }

    /**
     * Create with specific fabricante (Lista).
     */
    public function withFabricante(Lista $fabricante): static
    {
        return $this->state(fn (array $attributes) => [
            'fabricante_id' => $fabricante->id,
        ]);
    }

    /**
     * Create with serie.
     */
    public function withSerie(string $serie): static
    {
        return $this->state(fn (array $attributes) => [
            'serie' => $serie,
        ]);
    }
}
