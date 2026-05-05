<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Cotizacion;
use App\Models\OrdenTrabajo;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrdenTrabajo>
 */
class OrdenTrabajoFactory extends Factory
{
    protected $model = OrdenTrabajo::class;

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
            'estado' => 'Pendiente',
            'fecha_ingreso' => now(),
            'fecha_entrega' => now()->addDays(7),
            'telefono' => fake()->phoneNumber(),
            'observaciones' => fake()->optional()->sentence(),
            'guia' => fake()->optional()->bothify('??########'),
            'transportadora_id' => null,
            'direccion_id' => null,
            'archivo' => null,
            'motivo_cancelacion' => null,
        ];
    }

    /**
     * Indicate that the order is "Pendiente".
     */
    public function pendiente(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Pendiente',
        ]);
    }

    /**
     * Indicate that the order is "En Proceso".
     */
    public function enProceso(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'En Proceso',
        ]);
    }

    /**
     * Indicate that the order is "Completado".
     */
    public function completado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Completado',
        ]);
    }

    /**
     * Indicate that the order is "Cancelado".
     */
    public function cancelado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cancelado',
            'motivo_cancelacion' => 'Cancelado por el cliente',
        ]);
    }
}
