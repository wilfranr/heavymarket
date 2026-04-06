<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\{Referencia, Articulo, Lista};
use Illuminate\Database\Eloquent\Factories\Factory;

class ReferenciaFactory extends Factory
{
    protected $model = Referencia::class;

    public function definition(): array
    {
        return [
            'referencia' => fake()->unique()->numerify('REF-#####'),
            'articulo_id' => null,
            'marca_id' => null,
            'es_temporal' => false,
            'comentario' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the reference is temporal (from Landing).
     */
    public function temporal(): static
    {
        return $this->state(fn (array $attributes) => [
            'es_temporal' => true,
            'comentario' => 'Referencia temporal desde Landing - Requiere revisión',
        ]);
    }

    /**
     * Create with specific reference code.
     */
    public function withReferencia(string $referencia): static
    {
        return $this->state(fn (array $attributes) => [
            'referencia' => $referencia,
        ]);
    }

    /**
     * Create with marca (fabricante) relationship.
     */
    public function withMarca(Lista $marca): static
    {
        return $this->state(fn (array $attributes) => [
            'marca_id' => $marca->id,
        ]);
    }

    /**
     * Create with articulo relationship.
     */
    public function withArticulo(Articulo $articulo): static
    {
        return $this->state(fn (array $attributes) => [
            'articulo_id' => $articulo->id,
        ]);
    }
}
