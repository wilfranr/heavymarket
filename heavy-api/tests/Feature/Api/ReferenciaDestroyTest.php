<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para eliminar referencias (destroy)
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('destroy elimina una referencia exitosamente para Analista', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Referencia eliminada exitosamente');

    expectDatabaseMissing('referencias', ['id' => $referencia->id]);
});

it('destroy elimina referencia con marcas y articulos relacionados', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $articulo = Articulo::factory()->create();
    $referencia = Referencia::factory()->create([
        'marca_id' => $marca->id,
        'articulo_id' => $articulo->id,
    ]);

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200);
});

it('destroy devuelve 404 para referencia inexistente', function () {
    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/99999');

    $response->assertStatus(404);
});

it('destroy requiere autenticacion', function () {
    $referencia = Referencia::factory()->create();

    $response = $this->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(401);
});

it('destroy rechaza Vendedor sin permisos', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Vendedor');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(403);
});

it('destroy rechaza Logistica sin permisos', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(403);
});

it('destroy permite a super_admin', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200);
});

it('destroy permite a Administrador', function () {
    $referencia = Referencia::factory()->create();
    $user = createUserWithRole('Administrador');

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/v1/referencias/'.$referencia->id);

    $response->assertStatus(200);
});
