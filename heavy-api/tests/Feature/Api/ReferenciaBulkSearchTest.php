<?php

/**
 * Tests de Feature para búsqueda masiva de referencias
 */

beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('bulk search encuentra referencias existentes para analista', function () {
    $refA = \App\Models\Referencia::factory()->withReferencia('REF-BULK-A')->create();
    \App\Models\Referencia::factory()->withReferencia('REF-BULK-B')->create();

    $user = createUserWithRole('Analista');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search', [
            'items' => [
                ['codigo' => 'ref-bulk-a', 'cantidad' => 2],
                ['codigo' => 'REF-BULK-B', 'cantidad' => 1],
            ],
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('message', '2 referencia(s) encontrada(s)')
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.referencia_id', $refA->id)
        ->assertJsonPath('data.0.cantidad', 2)
        ->assertJsonPath('no_encontrados', []);
});

it('bulk search reporta no encontrados sin crear', function () {
    \App\Models\Referencia::factory()->withReferencia('SOLO-ESTA')->create();

    $user = createUserWithRole('Vendedor');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search', [
            'items' => [
                ['codigo' => 'SOLO-ESTA', 'cantidad' => 1],
                ['codigo' => 'NO-EXISTE', 'cantidad' => 1],
            ],
        ]);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('no_encontrados', ['NO-EXISTE']);

    expectDatabaseCount('referencias', 1);
});

it('bulk search requiere autenticación', function () {
    $response = $this->postJson('/v1/referencias/bulk-search', [
        'items' => [['codigo' => 'X', 'cantidad' => 1]],
    ]);

    $response->assertStatus(401);
});

it('bulk search rechaza usuario sin rol autorizado', function () {
    \App\Models\Referencia::factory()->withReferencia('R1')->create();

    $user = createUserWithRole('Cliente');

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/referencias/bulk-search', [
            'items' => [['codigo' => 'R1', 'cantidad' => 1]],
        ]);

    $response->assertStatus(403);
});
