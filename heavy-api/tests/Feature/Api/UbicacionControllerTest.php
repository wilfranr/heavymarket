<?php

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para UbicacionController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
});

it('countries devuelve lista de paises activos', function () {
    Country::create(['name' => 'Colombia', 'iso2' => 'CO', 'is_active' => true]);
    Country::create(['name' => 'Peru', 'iso2' => 'PE', 'is_active' => true]);
    Country::create(['name' => 'Inactivo', 'iso2' => 'XX', 'is_active' => false]);

    $response = $this->getJson('/v1/ubicaciones/paises');

    $response->assertStatus(200)
        ->assertJsonStructure(['data'])
        ->assertJsonCount(2, 'data');
});

it('states devuelve lista de estados', function () {
    $country = Country::create(['name' => 'Colombia', 'iso2' => 'CO', 'is_active' => true]);
    State::create(['name' => 'Bogota', 'country_id' => $country->id]);
    State::create(['name' => 'Medellin', 'country_id' => $country->id]);

    $response = $this->getJson('/v1/ubicaciones/departamentos');

    $response->assertStatus(200)
        ->assertJsonStructure(['data'])
        ->assertJsonCount(2, 'data');
});

it('states permite filtrar por country_id', function () {
    $country1 = Country::create(['name' => 'Colombia', 'iso2' => 'CO', 'is_active' => true]);
    $country2 = Country::create(['name' => 'Peru', 'iso2' => 'PE', 'is_active' => true]);
    State::create(['name' => 'Bogota', 'country_id' => $country1->id]);
    State::create(['name' => 'Lima', 'country_id' => $country2->id]);

    $response = $this->getJson('/v1/ubicaciones/departamentos?country_id='.$country1->id);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('cities devuelve lista de ciudades', function () {
    $country = Country::create(['name' => 'Colombia', 'iso2' => 'CO', 'is_active' => true]);
    $state = State::create(['name' => 'Bogota', 'country_id' => $country->id]);
    City::create(['name' => 'Suba', 'state_id' => $state->id, 'country_id' => $country->id]);
    City::create(['name' => 'Chapinero', 'state_id' => $state->id, 'country_id' => $country->id]);

    $response = $this->getJson('/v1/ubicaciones/ciudades');

    $response->assertStatus(200)
        ->assertJsonStructure(['data'])
        ->assertJsonCount(2, 'data');
});

it('cities permite filtrar por state_id', function () {
    $country = Country::create(['name' => 'Colombia', 'iso2' => 'CO', 'is_active' => true]);
    $state1 = State::create(['name' => 'Bogota', 'country_id' => $country->id]);
    $state2 = State::create(['name' => 'Medellin', 'country_id' => $country->id]);
    City::create(['name' => 'Suba', 'state_id' => $state1->id, 'country_id' => $country->id]);
    City::create(['name' => 'Laureles', 'state_id' => $state2->id, 'country_id' => $country->id]);

    $response = $this->getJson('/v1/ubicaciones/ciudades?state_id='.$state1->id);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});
