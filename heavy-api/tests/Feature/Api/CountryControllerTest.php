<?php

/**
 * Tests Feature para CountryController (CRUD de Países)
 */

use App\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();

    $this->superAdmin = createUserWithRole('super_admin');
    $this->admin = createUserWithRole('Administrador');
    $this->vendedor = createUserWithRole('Vendedor');
});

it('super admin puede listar países', function () {
    Country::factory()->count(3)->create();

    $response = $this->actingAs($this->superAdmin)
        ->getJson('/v1/countries');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('admin puede listar países', function () {
    Country::factory()->count(2)->create();

    $response = $this->actingAs($this->admin)
        ->getJson('/v1/countries');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('vendedor no puede listar países', function () {
    $response = $this->actingAs($this->vendedor)
        ->getJson('/v1/countries');

    $response->assertForbidden();
});

it('super admin puede ver detalle de país', function () {
    $country = Country::factory()->create(['name' => 'Colombia', 'flete' => 2.5]);

    $response = $this->actingAs($this->superAdmin)
        ->getJson("/v1/countries/{$country->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Colombia')
        ->assertJsonPath('data.flete', '2.50');
});

it('admin puede ver detalle de país', function () {
    $country = Country::factory()->create(['name' => 'México']);

    $response = $this->actingAs($this->admin)
        ->getJson("/v1/countries/{$country->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'México');
});

it('vendedor no puede ver detalle de país', function () {
    $country = Country::factory()->create();

    $response = $this->actingAs($this->vendedor)
        ->getJson("/v1/countries/{$country->id}");

    $response->assertForbidden();
});

it('super admin puede actualizar flete de país', function () {
    $country = Country::factory()->create(['flete' => null]);

    $response = $this->actingAs($this->superAdmin)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => 3.5,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.flete', '3.50');

    expect($country->fresh()->flete)->toBe('3.50');
});

it('admin puede actualizar flete de país', function () {
    $country = Country::factory()->create(['flete' => 2.0]);

    $response = $this->actingAs($this->admin)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => 5.0,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.flete', '5.00');
});

it('vendedor no puede actualizar flete de país', function () {
    $country = Country::factory()->create();

    $response = $this->actingAs($this->vendedor)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => 10.0,
        ]);

    $response->assertForbidden();
});

it('valida que flete sea numérico y no negativo', function () {
    $country = Country::factory()->create();

    $response = $this->actingAs($this->superAdmin)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => -5,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['flete']);
});

it('valida que flete no exceda 100', function () {
    $country = Country::factory()->create();

    $response = $this->actingAs($this->superAdmin)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => 150,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['flete']);
});

it('permite flete nulo', function () {
    $country = Country::factory()->create(['flete' => 2.5]);

    $response = $this->actingAs($this->superAdmin)
        ->putJson("/v1/countries/{$country->id}", [
            'flete' => null,
        ]);

    $response->assertOk();
    expect($country->fresh()->flete)->toBeNull();
});

it('soporta búsqueda por nombre con paginación', function () {
    Country::factory()->count(5)->create();
    Country::factory()->create(['name' => 'Colombia']);

    $response = $this->actingAs($this->superAdmin)
        ->getJson('/v1/countries?search=Col&per_page=10');

    $response->assertOk()
        ->assertJsonPath('meta.per_page', 10);
});

it('requiere autenticación para cualquier endpoint', function () {
    $country = Country::factory()->create();

    $this->getJson('/v1/countries')->assertUnauthorized();
    $this->getJson("/v1/countries/{$country->id}")->assertUnauthorized();
    $this->putJson("/v1/countries/{$country->id}", ['flete' => 5])->assertUnauthorized();
});
