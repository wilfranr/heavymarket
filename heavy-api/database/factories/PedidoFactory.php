<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contacto;
use App\Models\Lista;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pedido>
 */
class PedidoFactory extends Factory
{
    protected $model = Pedido::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tercero_id' => Tercero::factory(),
            'direccion' => fake()->optional()->address(),
            'comentario' => fake()->optional()->sentence(),
            'contacto_id' => null,
            'estado' => 'Nuevo',
            'maquina_id' => null,
            'fabricante_id' => null,
            'motivo_rechazo' => null,
            'comentarios_rechazo' => null,
        ];
    }

    /**
     * Indicate that the pedido is in "Nuevo" state.
     */
    public function nuevo(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Nuevo',
        ]);
    }

    /**
     * Indicate that the pedido is in "Cotizado" state.
     */
    public function cotizado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cotizado',
        ]);
    }

    /**
     * Indicate that the pedido is in "Aprobado" state.
     */
    public function aprobado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Aprobado',
        ]);
    }

    /**
     * Indicate that the pedido is in "Entregado" state.
     */
    public function entregado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Entregado',
        ]);
    }

    /**
     * Indicate that the pedido is in "Cancelado" state.
     */
    public function cancelado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Cancelado',
        ]);
    }

    /**
     * Indicate that the pedido is in "Rechazado" state.
     */
    public function rechazado(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'Rechazado',
            'motivo_rechazo' => 'Precio no acordado',
            'comentarios_rechazo' => 'El cliente no aceptó la cotización',
        ]);
    }

    /**
     * Create with a specific maquina.
     */
    public function withMaquina(Maquina $maquina): static
    {
        return $this->state(fn (array $attributes) => [
            'maquina_id' => $maquina->id,
        ]);
    }

    /**
     * Create with a specific fabricante (Lista).
     */
    public function withFabricante(Lista $fabricante): static
    {
        return $this->state(fn (array $attributes) => [
            'fabricante_id' => $fabricante->id,
        ]);
    }

    /**
     * Create with a specific contacto.
     */
    public function withContacto(Contacto $contacto): static
    {
        return $this->state(fn (array $attributes) => [
            'contacto_id' => $contacto->id,
        ]);
    }

    /**
     * Create with a specific tercero.
     */
    public function withTercero(Tercero $tercero): static
    {
        return $this->state(fn (array $attributes) => [
            'tercero_id' => $tercero->id,
        ]);
    }
}
