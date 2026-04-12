<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contacto;
use App\Models\Country;
use App\Models\Tercero;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactoFactory extends Factory
{
    protected $model = Contacto::class;

    public function definition(): array
    {
        return [
            'tercero_id' => Tercero::factory(),
            'nombre' => fake()->name(),
            'cargo' => fake()->optional()->jobTitle(),
            'telefono' => fake()->numerify('60# ### ####'),
            'indicativo' => '+57',
            'country_id' => Country::first()?->id,
            'email' => fake()->optional()->safeEmail(),
            'principal' => false,
        ];
    }

    /**
     * Indicate that this is the main contact.
     */
    public function principal(): static
    {
        return $this->state(fn (array $attributes) => [
            'principal' => true,
        ]);
    }

    /**
     * Create with specific tercero.
     */
    public function withTercero(Tercero $tercero): static
    {
        return $this->state(fn (array $attributes) => [
            'tercero_id' => $tercero->id,
        ]);
    }

    /**
     * Create with phone.
     */
    public function withPhone(string $telefono): static
    {
        return $this->state(fn (array $attributes) => [
            'telefono' => $telefono,
        ]);
    }

    /**
     * Create with email.
     */
    public function withEmail(string $email): static
    {
        return $this->state(fn (array $attributes) => [
            'email' => $email,
        ]);
    }
}
