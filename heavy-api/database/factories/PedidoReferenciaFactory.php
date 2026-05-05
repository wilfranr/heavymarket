<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PedidoReferencia>
 */
class PedidoReferenciaFactory extends Factory
{
    protected $model = PedidoReferencia::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pedido_id' => Pedido::factory(),
            'referencia_id' => Referencia::factory(),
            'sistema_id' => null,
            'lista_id' => null,
            'categoria_comercial_id' => null,
            'marca_id' => null,
            'definicion' => fake()->optional()->sentence(),
            'cantidad' => fake()->numberBetween(1, 10),
            'comentario' => null,
            'imagen' => null,
            'mostrar_referencia' => true,
            'estado' => 'Pendiente',
        ];
    }

    /**
     * Indicate that the reference is approved.
     */
    public function aprobada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Aprobada',
        ]);
    }

    /**
     * Indicate that the reference is cotizada.
     */
    public function cotizada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cotizada',
        ]);
    }
}
