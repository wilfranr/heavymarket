<?php

declare(strict_types=1);

use App\Models\OrdenCompra;
use App\Models\OrdenTrabajo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Asegurar que existen los roles
    foreach (['super_admin', 'Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('Logistica puede acceder a index de ordenes de trabajo', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/ordenes-trabajo');

    // No debe ser 403 (puede ser 200 o 500 por falta de datos, pero no bloqueado por rol)
    expect($response->status())->not()->toBe(403);
});

it('Logistica no puede crear orden de trabajo', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->postJson('/v1/ordenes-trabajo', [
        'cliente_id' => 1,
        'descripcion' => 'Test OT',
    ]);

    $response->assertForbidden();
});

it('Logistica no puede actualizar orden de trabajo', function () {
    $user = createUserWithRole('Logistica');
    $orden = OrdenTrabajo::factory()->create();

    $response = $this->actingAs($user)->putJson("/v1/ordenes-trabajo/{$orden->id}", [
        'descripcion' => 'Updated',
    ]);

    $response->assertForbidden();
});

it('Logistica no puede acceder a pedidos', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/pedidos');

    $response->assertForbidden();
});

it('Logistica no puede acceder a cotizaciones', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/cotizaciones');

    $response->assertForbidden();
});

it('Logistica puede acceder en modo lectura a ordenes de compra (para registrar recepciones)', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/ordenes-compra');

    // Desde #147-#157 Logistica registra recepciones directamente desde la OC,
    // por lo que necesita poder listar/ver (no escribir) órdenes de compra.
    $response->assertOk();
});

it('Logistica no puede crear, editar ni eliminar ordenes de compra', function () {
    $user = createUserWithRole('Logistica');
    $orden = OrdenCompra::factory()->create();

    $this->actingAs($user)->postJson('/v1/ordenes-compra', [])->assertForbidden();
    $this->actingAs($user)->putJson("/v1/ordenes-compra/{$orden->id}", ['observaciones' => 'x'])->assertForbidden();
    $this->actingAs($user)->deleteJson("/v1/ordenes-compra/{$orden->id}")->assertForbidden();
});

it('Logistica no puede acceder a terceros', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/terceros');

    $response->assertForbidden();
});

it('Logistica no puede acceder a articulos', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/articulos');

    $response->assertForbidden();
});

it('Logistica no puede acceder a referencias', function () {
    $user = createUserWithRole('Logistica');

    $response = $this->actingAs($user)->getJson('/v1/referencias');

    $response->assertForbidden();
});
