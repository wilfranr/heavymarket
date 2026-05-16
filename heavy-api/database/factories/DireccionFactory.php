<?php

namespace Database\Factories;

use App\Models\City;
use App\Models\Country;
use App\Models\Direccion;
use App\Models\State;
use App\Models\Tercero;
use App\Models\Transportadora;
use Illuminate\Database\Eloquent\Factories\Factory;

class DireccionFactory extends Factory
{
    protected $model = Direccion::class;

    public function definition(): array
    {
        return [
            'tercero_id' => Tercero::factory(),
            'direccion' => $this->faker->address(),
            'city_id' => City::factory(),
            'state_id' => State::factory(),
            'country_id' => Country::factory(),
            'principal' => $this->faker->boolean(),
            'destinatario' => $this->faker->name(),
            'nit_cc' => $this->faker->numerify('#########'),
            'transportadora_id' => Transportadora::factory(),
            'forma_pago' => $this->faker->randomElement(['Contado', 'Crédito', 'Anticipado']),
            'telefono' => $this->faker->phoneNumber(),
            'ciudad_texto' => $this->faker->city(),
        ];
    }
}
