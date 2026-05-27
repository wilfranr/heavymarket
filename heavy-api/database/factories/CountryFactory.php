<?php

namespace Database\Factories;

use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

class CountryFactory extends Factory
{
    protected $model = Country::class;

    public function definition(): array
    {
        $suffix = $this->faker->unique()->numberBetween(1000, 999999);

        return [
            'name' => 'Pais Test '.$suffix,
            'iso2' => strtoupper(substr((string) $suffix, -2)),
            'is_active' => true,
        ];
    }
}
