<?php

namespace Database\Factories;

use App\Models\Cotizacion;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cotizacion>
 */
class CotizacionFactory extends Factory
{
    protected $model = Cotizacion::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tercero_id' => Tercero::factory(),
            'pedido_id' => Pedido::factory(),
            'estado' => $this->faker->randomElement(['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'En_Proceso']),
            'fecha_emision' => now(),
            'fecha_vencimiento' => now()->addDays(30),
            'observaciones' => $this->faker->optional()->sentence(),
            'total' => $this->faker->optional()->randomFloat(2, 1000, 100000),
        ];
    }

    public function pendiente(): self
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Pendiente',
        ]);
    }

    public function enviada(): self
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Enviada',
        ]);
    }

    public function aprobada(): self
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Aprobada',
        ]);
    }

    public function rechazada(): self
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Rechazada',
        ]);
    }
}
