<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrdenCompraEstado;
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
            'estado' => OrdenCompraEstado::Generada->value,
            'fecha_expedicion' => now(),
            'fecha_entrega' => now()->addDays(7),
            'observaciones' => fake()->optional()->sentence(),
            'valor_total' => fake()->randomFloat(2, 100, 10000),
            'direccion' => fake()->optional()->address(),
            'telefono' => fake()->optional()->phoneNumber(),
            'guia' => fake()->optional()->bothify('??########'),
            'color' => OrdenCompraEstado::Generada->color(),
        ];
    }

    /**
     * Indicate that the order is "Generada".
     */
    public function pendiente(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => OrdenCompraEstado::Generada->value,
            'color' => OrdenCompraEstado::Generada->color(),
        ]);
    }

    public function generada(): static
    {
        return $this->pendiente();
    }

    /**
     * Indicate that the order is "Confirmada".
     */
    public function enProceso(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => OrdenCompraEstado::Confirmada->value,
            'color' => OrdenCompraEstado::Confirmada->color(),
        ]);
    }

    /**
     * Indicate that the order is "Recibida".
     */
    public function entregado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => OrdenCompraEstado::Recibida->value,
            'color' => OrdenCompraEstado::Recibida->color(),
        ]);
    }

    /**
     * Indicate that the order is "Cancelada".
     */
    public function cancelado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => OrdenCompraEstado::Cancelada->value,
            'color' => OrdenCompraEstado::Cancelada->color(),
        ]);
    }
}
