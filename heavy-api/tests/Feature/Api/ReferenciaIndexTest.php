<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para listado de referencias (index)
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('index devuelve lista paginada de referencias para analista', function () {
    $refs = Referencia::factory()->count(5)->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ])
        ->assertJsonCount(5, 'data');
});

it('index permite filtrar por search en referencia', function () {
    Referencia::factory()->withReferencia('REF-BUSQUEDA-A')->create();
    Referencia::factory()->withReferencia('REF-OTRA-B')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?search=busqueda');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.referencia', 'REF-BUSQUEDA-A');
});

it('index permite filtrar por search en comentario', function () {
    Referencia::factory()->create(['comentario' => 'Comentario importante de prueba']);
    Referencia::factory()->create(['comentario' => 'Otro comentario diferente']);

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?search=importante');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('index permite filtrar por marca_id', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    Referencia::factory()->withMarca($marca)->create();
    Referencia::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?marca_id='.$marca->id);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.marca_id', $marca->id);
});

it('index permite filtrar por es_temporal true', function () {
    Referencia::factory()->temporal()->create();
    Referencia::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?es_temporal=1');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.es_temporal', 1);
});

it('index permite filtrar por es_temporal false', function () {
    Referencia::factory()->temporal()->create();
    Referencia::factory()->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?es_temporal=0');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.es_temporal', 0);
});

it('index permite paginacion personalizada', function () {
    Referencia::factory()->count(15)->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?per_page=5');

    $response->assertStatus(200)
        ->assertJsonPath('meta.per_page', 5)
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.total', 15);
});

it('index permite ordenamiento ascendente', function () {
    Referencia::factory()->withReferencia('ZZZ-AAA')->create();
    Referencia::factory()->withReferencia('AAA-ZZZ')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?sort_by=referencia&sort_order=asc');

    $response->assertStatus(200)
        ->assertJsonPath('data.0.referencia', 'AAA-ZZZ');
});

it('index permite ordenamiento descendente', function () {
    Referencia::factory()->withReferencia('ZZZ-AAA')->create();
    Referencia::factory()->withReferencia('AAA-ZZZ')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias?sort_by=referencia&sort_order=desc');

    $response->assertStatus(200)
        ->assertJsonPath('data.0.referencia', 'ZZZ-AAA');
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/referencias');

    $response->assertStatus(401);
});

it('index permite acceso a cualquier usuario autenticado', function () {
    $user = createUserWithRole('Cliente');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias');

    // El endpoint index no tiene autorizacion en el controlador
    $response->assertStatus(200);
});

it('index carga relaciones de marca y articulo', function () {
    $marca = Lista::factory()->create(['tipo' => 'Marca']);
    $articulo = Articulo::factory()->create();
    $ref = Referencia::factory()->create([
        'marca_id' => $marca->id,
        'articulo_id' => $articulo->id,
    ]);

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/referencias');

    $response->assertStatus(200)
        ->assertJsonPath('data.0.marca.id', $marca->id)
        ->assertJsonPath('data.0.articulo.id', $articulo->id);
});
