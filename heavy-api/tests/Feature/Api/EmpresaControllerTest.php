<?php

use App\Models\Empresa;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Tests de Feature para EmpresaController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
});

it('index devuelve lista paginada de empresas', function () {
    Empresa::create(['nombre' => 'Empresa 1', 'siglas' => 'E1', 'celular' => '3001234567', 'email' => 'e1@test.com', 'nit' => '111', 'direccion' => 'Calle 1', 'representante' => 'Rep 1']);
    Empresa::create(['nombre' => 'Empresa 2', 'siglas' => 'E2', 'celular' => '3001234568', 'email' => 'e2@test.com', 'nit' => '222', 'direccion' => 'Calle 2', 'representante' => 'Rep 2']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/empresas');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/empresas');
    $response->assertStatus(401);
});

it('store crea una empresa exitosamente', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/empresas', [
            'nombre' => 'Empresa Test',
            'siglas' => 'ET',
            'nit' => '123456789-0',
            'email' => 'empresa@test.com',
            'celular' => '3001234567',
            'direccion' => 'Calle Test',
            'representante' => 'Representante Test',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'nombre', 'siglas', 'nit'],
        ])
        ->assertJsonPath('data.nombre', 'Empresa Test');
});

it('show devuelve una empresa especifica', function () {
    $empresa = Empresa::create(['nombre' => 'Empresa Show', 'siglas' => 'ES', 'celular' => '3001234567', 'email' => 'show@test.com', 'nit' => '333', 'direccion' => 'Calle Show', 'representante' => 'Rep Show']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/empresas/'.$empresa->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $empresa->id);
});

it('update modifica una empresa', function () {
    $empresa = Empresa::create(['nombre' => 'Original', 'siglas' => 'OR', 'celular' => '3001234567', 'email' => 'orig@test.com', 'nit' => '444', 'direccion' => 'Calle Ori', 'representante' => 'Rep Ori']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/empresas/'.$empresa->id, [
            'nombre' => 'Actualizada',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.nombre', 'Actualizada');
});

it('destroy elimina una empresa', function () {
    $empresa = Empresa::create(['nombre' => 'ToDelete', 'siglas' => 'TD', 'celular' => '3001234567', 'email' => 'del@test.com', 'nit' => '555', 'direccion' => 'Calle Del', 'representante' => 'Rep Del']);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson('/v1/empresas/'.$empresa->id)
        ->assertStatus(204);
});
