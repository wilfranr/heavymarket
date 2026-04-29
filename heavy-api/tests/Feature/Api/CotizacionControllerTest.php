<?php

/**
 * Tests de Feature para Cotizaciones
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);

    $this->admin = createUserWithRole('Administrador');
    $this->analista = createUserWithRole('Analista');
    $this->vendedor = createUserWithRole('Vendedor');
});

it('requiere autenticación para listar cotizaciones', function () {
    $this->getJson('/v1/cotizaciones')->assertStatus(401);
});

it('admin puede listar cotizaciones', function () {
    \App\Models\Cotizacion::factory()->count(3)->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->getJson('/v1/cotizaciones');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'user_id', 'tercero_id', 'pedido_id', 'estado', 'total'],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
});

it('permite filtrar cotizaciones por estado', function () {
    \App\Models\Cotizacion::factory()->enviada()->count(2)->create();
    \App\Models\Cotizacion::factory()->aprobada()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->getJson('/v1/cotizaciones?estado=Enviada');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(2);
});

it('permite ver detalle de cotización', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->getJson("/v1/cotizaciones/{$cotizacion->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['id', 'estado', 'total', 'pedido_id'],
        ]);
});

it('permite crear cotización', function () {
    $pedido = \App\Models\Pedido::factory()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson('/v1/cotizaciones', [
            'pedido_id' => $pedido->id,
            'tercero_id' => $pedido->tercero_id,
            'estado' => 'En_Proceso',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Cotización creada exitosamente');

    expectDatabaseHas('cotizaciones', [
        'pedido_id' => $pedido->id,
        'estado' => 'En_Proceso',
    ]);
});

it('permite actualizar cotización', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->pendiente()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
            'estado' => 'Enviada',
            'observaciones' => 'Cotización enviada al cliente',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.estado', 'Enviada');
});

it('admin puede eliminar cotización', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->create();

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/v1/cotizaciones/{$cotizacion->id}")->assertStatus(204);
});

it('analista puede ver cotizaciones', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->create();

    $this->actingAs($this->analista, 'sanctum')
        ->getJson("/v1/cotizaciones/{$cotizacion->id}")->assertStatus(200);
});

it('vendedor puede ver sus cotizaciones', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->create(['user_id' => $this->vendedor->id]);

    $this->actingAs($this->vendedor, 'sanctum')
        ->getJson("/v1/cotizaciones/{$cotizacion->id}")->assertStatus(200);
});

it('rechaza crear cotización sin pedido', function () {
    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson('/v1/cotizaciones', [
            'tercero_id' => 1,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['pedido_id']);
});

it('rechaza actualizar con estado inválido', function () {
    $cotizacion = \App\Models\Cotizacion::factory()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
            'estado' => 'EstadoInvalido',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['estado']);
});
