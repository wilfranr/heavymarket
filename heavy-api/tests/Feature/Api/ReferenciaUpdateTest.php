<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para actualizar referencias (update)
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('update modifica una referencia exitosamente para Analista', function () {
    $referencia = Referencia::factory()->create(['referencia' => 'OLD-REF-001']);
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => 'UPDATED-REF-001',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.referencia', 'UPDATED-REF-001');
});

it('update convierte referencia temporal en oficial', function () {
    $referencia = Referencia::factory()->temporal()->create();
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => $referencia->referencia,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.es_temporal', 0);
});

it('update limpia comentario automatico al convertir temporal en oficial', function () {
    $referencia = Referencia::factory()->temporal()->create();
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => $referencia->referencia,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.comentario', null);
});

it('update permite cambiar marca y articulo', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $articulo = Articulo::factory()->create();
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => $referencia->referencia,
            'marca_id' => $marca->id,
            'articulo_id' => $articulo->id,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.marca_id', $marca->id)
        ->assertJsonPath('data.articulo_id', $articulo->id);
});

it('update permite actualizar comentario manualmente', function () {
    $referencia = Referencia::factory()->create(['comentario' => null]);
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => $referencia->referencia,
            'comentario' => 'Nuevo comentario manual',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.comentario', 'Nuevo comentario manual');
});

it('update rejects referencia duplicada', function () {
    $ref1 = Referencia::factory()->withReferencia('DUPE-A')->create();
    $ref2 = Referencia::factory()->withReferencia('DUPE-B')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$ref2->id, [
            'referencia' => 'DUPE-A',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['referencia']);
});

it('update requiere autenticacion', function () {
    $referencia = Referencia::factory()->create();

    $response = $this->putJson('/v1/referencias/'.$referencia->id, [
        'referencia' => 'NEW-REF',
    ]);

    $response->assertStatus(401);
});

it('update rechaza usuario sin permisos', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => 'NEW-REF',
        ]);

    $response->assertStatus(403);
});

it('update permite a super_admin', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/v1/referencias/'.$referencia->id, [
            'referencia' => 'ADMIN-UPDATED-REF',
        ]);

    $response->assertStatus(200);
});
