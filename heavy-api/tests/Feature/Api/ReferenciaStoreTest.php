<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para creacion de referencias (store)
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('store crea una referencia exitosamente para Analista', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-CREATE-'.uniqid(),
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'referencia', 'marca_id', 'articulo_id', 'comentario', 'created_at'],
        ]);
});

it('store crea una referencia con marca y articulo', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $articulo = Articulo::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-MARCA-'.uniqid(),
            'marca_id' => $marca->id,
            'articulo_id' => $articulo->id,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.marca_id', $marca->id)
        ->assertJsonPath('data.articulo_id', $articulo->id);
});

it('store crea una referencia con comentario', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-COMENT-'.uniqid(),
            'comentario' => 'Este es un comentario de prueba',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.comentario', 'Este es un comentario de prueba');
});

it('store rejects referencia duplicada', function () {
    $existingRef = Referencia::factory()->withReferencia('DUPLICATE-REF-TEST')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'DUPLICATE-REF-TEST',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['referencia']);
});

it('store rejects referencia vacia', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => '',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['referencia']);
});

it('store rejects referencia sin contenido', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['referencia']);
});

it('store rejects marca inexistente', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-MARCA-INVALIDA-'.uniqid(),
            'marca_id' => 99999,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['marca_id']);
});

it('store rejects articulo inexistente', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-ARTICULO-INVALIDO-'.uniqid(),
            'articulo_id' => 99999,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['articulo_id']);
});

it('store requiere autenticacion', function () {
    $response = $this->postJson('/v1/referencias', [
        'referencia' => 'TEST-REF-AUTH-'.uniqid(),
    ]);

    $response->assertStatus(401);
});

it('store permite a Vendedor', function () {
    $user = createUserWithRole('Vendedor');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-VENDEDOR-'.uniqid(),
        ]);

    $response->assertStatus(201);
});

it('store permite a super_admin', function () {
    $user = createUserWithRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-ADMIN-'.uniqid(),
        ]);

    $response->assertStatus(201);
});

it('store permite a Administrador', function () {
    $user = createUserWithRole('Administrador');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias', [
            'referencia' => 'TEST-REF-ADMIN2-'.uniqid(),
        ]);

    $response->assertStatus(201);
});
