<?php

use App\Models\Transportadora;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para TransportadoraController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
});

it('index devuelve lista paginada de transportadoras', function () {
    Transportadora::factory()->count(5)->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/transportadoras');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ])
        ->assertJsonCount(5, 'data');
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/transportadoras');
    $response->assertStatus(401);
});

it('store crea una transportadora exitosamente', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/transportadoras', [
            'nombre' => 'Transportadora Test',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'nombre'],
        ])
        ->assertJsonPath('data.nombre', 'Transportadora Test');
});

it('show devuelve una transportadora especifica', function () {
    $transportadora = Transportadora::factory()->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/transportadoras/'.$transportadora->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $transportadora->id);
});

it('update modifica una transportadora', function () {
    $transportadora = Transportadora::factory()->create(['nombre' => 'Original']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/transportadoras/'.$transportadora->id, [
            'nombre' => 'Actualizada',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.nombre', 'Actualizada');
});

it('destroy elimina una transportadora', function () {
    $transportadora = Transportadora::factory()->create();

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson('/v1/transportadoras/'.$transportadora->id)
        ->assertStatus(204);
});
