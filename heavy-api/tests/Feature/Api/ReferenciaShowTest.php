<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para ver detalle de referencia (show)
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('show devuelve los datos de una referencia para analista', function () {
    $referencia = Referencia::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $referencia->id)
        ->assertJsonPath('data.referencia', $referencia->referencia);
});

it('show devuelve la referencia con sus relaciones', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $articulo = Articulo::factory()->create();
    $referencia = Referencia::factory()->create([
        'marca_id' => $marca->id,
        'articulo_id' => $articulo->id,
    ]);

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.marca.id', $marca->id)
        ->assertJsonPath('data.articulo.id', $articulo->id);
});

it('show devuelve 404 para referencia inexistente', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias/99999');

    $response->assertStatus(404);
});

it('show requiere autenticacion', function () {
    $referencia = Referencia::factory()->create();

    $response = $this->getJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(401);
});

it('show permite acceso a cualquier usuario autenticado', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Cliente');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias/'.$referencia->id);

    // El endpoint show no tiene autorizacion en el controlador
    $response->assertStatus(200);
});
