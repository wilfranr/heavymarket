<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\{Pedido, User, Tercero, Maquina, Fabricante, Contacto};
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
            'estado' => fake()->randomElement([
                'Nuevo',
                'Enviado',
                'Entregado',
                'Cancelado',
                'Rechazado',
                'Cotizado',
                'En_Costeo',
                'Aprobado'
            ]),
            'maquina_id' => null,
            'fabricante_id' => null,
            'motivo_rechazo' => null,
            'comentarios_rechazo' => null,
        ];
    }
}
