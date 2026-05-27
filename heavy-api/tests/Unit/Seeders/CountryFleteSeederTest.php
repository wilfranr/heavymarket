<?php

use App\Models\Country;
use Database\Seeders\CountryFleteSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('CountryFleteSeeder asigna 2.5 a Colombia por iso2', function () {
    $colombia = Country::factory()->create(['name' => 'Colombia', 'iso2' => 'CO', 'flete' => null]);

    (new CountryFleteSeeder)->run();

    expect((float) $colombia->fresh()->flete)->toBe(2.5);
});

it('Country esColombia identifica país por iso2 e id 48', function () {
    expect(Country::esColombia(48, 'CO'))->toBeTrue()
        ->and(Country::esColombia(99, 'CO'))->toBeTrue()
        ->and(Country::esColombia(99, 'US'))->toBeFalse();
});
