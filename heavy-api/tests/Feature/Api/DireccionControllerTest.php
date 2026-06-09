<?php

use App\Models\Direccion;
use App\Models\Tercero;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/**
 * Tests de Feature para DireccionController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
    $this->tercero = Tercero::factory()->create();
});

it('index devuelve lista paginada de direcciones', function () {
    Direccion::factory()->count(5)->create(['tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/direcciones');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ])
        ->assertJsonCount(5, 'data');
});

it('index permite filtrar por tercero_id', function () {
    $tercero2 = Tercero::factory()->create();
    Direccion::factory()->count(3)->create(['tercero_id' => $this->tercero->id]);
    Direccion::factory()->count(2)->create(['tercero_id' => $tercero2->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/direcciones?tercero_id='.$this->tercero->id);

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

it('index permite buscar por direccion', function () {
    Direccion::factory()->create(['direccion' => 'Calle 123 #45-67', 'tercero_id' => $this->tercero->id]);
    Direccion::factory()->create(['direccion' => 'Carrera 10 #20-30', 'tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/direcciones?search=Calle');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/direcciones');
    $response->assertStatus(401);
});

it('store crea una direccion exitosamente', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/direcciones', [
            'tercero_id' => $this->tercero->id,
            'direccion' => 'Calle 100 #15-20',
            'ciudad_texto' => 'Bogota',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'direccion', 'tercero_id'],
        ])
        ->assertJsonPath('data.direccion', 'Calle 100 #15-20');
});

it('store rejects sin direccion', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/direcciones', [
            'tercero_id' => $this->tercero->id,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['direccion']);
});

it('show devuelve una direccion especifica', function () {
    $direccion = Direccion::factory()->create(['tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/direcciones/'.$direccion->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $direccion->id);
});

it('update modifica una direccion', function () {
    $direccion = Direccion::factory()->create(['tercero_id' => $this->tercero->id, 'direccion' => 'Original']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/direcciones/'.$direccion->id, [
            'direccion' => 'Actualizada',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.direccion', 'Actualizada');
});

it('destroy elimina una direccion', function () {
    $direccion = Direccion::factory()->create(['tercero_id' => $this->tercero->id]);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson('/v1/direcciones/'.$direccion->id)
        ->assertStatus(204);
});
