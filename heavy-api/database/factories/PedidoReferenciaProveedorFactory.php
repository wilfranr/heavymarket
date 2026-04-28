<?php

namespace Database\Factories;

use App\Models\Pedido;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\Tercero;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PedidoReferenciaProveedor>
 */
class PedidoReferenciaProveedorFactory extends Factory
{
    protected $model = PedidoReferenciaProveedor::class;

    public function definition(): array
    {
        return [
            'pedido_id' => Pedido::factory(),
            'tercero_id' => Tercero::factory(),
            'referencia_id' => Referencia::factory(),
            'cantidad' => $this->faker->numberBetween(1, 100),
            'valor_unidad' => $this->faker->randomFloat(2, 1000, 50000),
            'valor_total' => 0,
            'tiempo_entrega_dias' => $this->faker->numberBetween(5, 60),
            'comentario' => $this->faker->optional()->sentence(),
        ];
    }

    public function configure(): self
    {
        return $this->afterMaking(function (PedidoReferenciaProveedor $prp) {
            $prp->valor_total = $prp->cantidad * $prp->valor_unidad;
        });
    }
}
