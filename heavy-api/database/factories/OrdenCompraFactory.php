<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Cotizacion;
use App\Models\OrdenCompra;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrdenCompra>
 */
class OrdenCompraFactory extends Factory
{
    protected $model = OrdenCompra::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tercero_id' => Tercero::factory(),
            'pedido_id' => Pedido::factory(),
            'cotizacion_id' => Cotizacion::factory(),
            'proveedor_id' => Tercero::factory(),
            'estado' => 'Pendiente',
            'fecha_expedicion' => now(),
            'fecha_entrega' => now()->addDays(7),
            'observaciones' => fake()->optional()->sentence(),
            'valor_total' => fake()->randomFloat(2, 100, 10000),
            'direccion' => fake()->optional()->address(),
            'telefono' => fake()->optional()->phoneNumber(),
            'guia' => fake()->optional()->bothify('??########'),
            'color' => '#FFFF00',
        ];
    }

    /**
     * Indicate that the order is "Pendiente".
     */
    public function pendiente(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Pendiente',
            'color' => '#FFFF00',
        ]);
    }

    /**
     * Indicate that the order is "En proceso".
     */
    public function enProceso(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'En proceso',
            'color' => '#FFFF00',
        ]);
    }

    /**
     * Indicate that the order is "Entregado".
     */
    public function entregado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Entregado',
            'color' => '#00ff00',
        ]);
    }

    /**
     * Indicate that the order is "Cancelado".
     */
    public function cancelado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cancelado',
            'color' => '#ff0000',
        ]);
    }
}
