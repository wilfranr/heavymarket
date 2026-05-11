<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para bulkSearchOrCreate
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('bulkSearchOrCreate encuentra referencias existentes', function () {
    $ref1 = Referencia::factory()->withReferencia('EXIST-A')->create();
    Referencia::factory()->withReferencia('EXIST-B')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => 'exist-a', 'cantidad' => 2],
                ['codigo' => 'EXIST-B', 'cantidad' => 1],
            ],
        ]);

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

it('bulkSearchOrCreate crea nuevas referencias cuando no existen', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => 'NEW-REF-'.uniqid(), 'cantidad' => 1],
            ],
        ]);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('bulkSearchOrCreate asocia articulo y limpia temporal', function () {
    $temporalRef = Referencia::factory()->temporal()->create();
    $articulo = Articulo::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => $temporalRef->referencia, 'cantidad' => 1],
            ],
            'articulo_id' => $articulo->id,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.0.referencia.articulo_id', $articulo->id)
        // La respuesta devuelve boolean false, no integer 0
        ->assertJsonPath('data.0.referencia.es_temporal', false)
        ->assertJsonPath('data.0.referencia.comentario', null);
});

it('bulkSearchOrCreate asocia marca', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $ref = Referencia::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => $ref->referencia, 'cantidad' => 1],
            ],
            'marca_id' => $marca->id,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.0.referencia.marca_id', $marca->id);
});

it('bulkSearchOrCreate mixto: encuentra algunos, crea otros', function () {
    $existing = Referencia::factory()->withReferencia('EXIST-MIX')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => 'EXIST-MIX', 'cantidad' => 1],
                ['codigo' => 'NEW-MIX-'.uniqid(), 'cantidad' => 2],
            ],
        ]);

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

it('bulkSearchOrCreate marca como temporal con comentario', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [
                ['codigo' => 'TEMP-REF-'.uniqid(), 'cantidad' => 1],
            ],
            'es_temporal' => true,
            'comentario_temporal' => 'Comentario temporal de prueba',
        ]);

    $response->assertStatus(200)
        // La respuesta devuelve boolean true, no integer 1
        ->assertJsonPath('data.0.referencia.es_temporal', true)
        ->assertJsonPath('data.0.referencia.comentario', 'Comentario temporal de prueba');
});

it('bulkSearchOrCreate requiere autenticacion', function () {
    $response = $this->postJson('/v1/referencias/bulk-search-or-create', [
        'items' => [['codigo' => 'X', 'cantidad' => 1]],
    ]);

    $response->assertStatus(401);
});

it('bulkSearchOrCreate permite a cualquier usuario autenticado', function () {
    // El endpoint bulk-search-or-create no tiene autorizacion especial en el controlador
    $user = createUserWithRole('Cliente');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search-or-create', [
            'items' => [['codigo' => 'X', 'cantidad' => 1]],
        ]);

    // El endpoint acepta cualquier usuario autenticado
    $response->assertStatus(200);
});
