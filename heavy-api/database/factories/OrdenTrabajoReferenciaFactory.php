<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\PedidoReferencia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrdenTrabajoReferencia>
 */
class OrdenTrabajoReferenciaFactory extends Factory
{
    protected $model = OrdenTrabajoReferencia::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'orden_trabajo_id' => OrdenTrabajo::factory(),
            'pedido_referencia_id' => PedidoReferencia::factory(),
            'cantidad_cotizada' => fake()->numberBetween(1, 10),
            'cantidad_recibida' => 0,
            'estado' => 'Pendiente',
            'recibido' => false,
            'fecha_recepcion' => null,
            'observaciones' => null,
        ];
    }

    /**
     * Indicate that the reference is received.
     */
    public function recibido(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Recibido',
            'recibido' => true,
            'fecha_recepcion' => now(),
        ]);
    }

    /**
     * Indicate that the reference is cancelled.
     */
    public function cancelado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cancelado',
            'recibido' => false,
            'observaciones' => 'Cancelado por el proveedor',
        ]);
    }

    /**
     * Indicate that the reference is dispatched.
     */
    public function despachado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Despachado',
            'recibido' => true,
            'fecha_recepcion' => now()->subDays(2),
        ]);
    }
}
