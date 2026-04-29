<?php

/**
 * Tests para Issue #101 - Items con mismo metadata pero diferente cantidad
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
    $this->analista = createUserWithRole('Analista');
});

it('API retorna items con mismo metadata pero diferente cantidad', function () {
    $sistema = \App\Models\Sistema::create(['nombre' => 'SISTEMA TEST']);
    $lista = \App\Models\Lista::factory()->create(['tipo' => 'Categoría Comercial']);
    $pedido = \App\Models\Pedido::factory()->create(['estado' => 'En_Analisis']);

    \App\Models\PedidoReferencia::create([
        'pedido_id' => $pedido->id,
        'sistema_id' => $sistema->id,
        'lista_id' => $lista->id,
        'definicion' => 'Filtro de Aceite',
        'cantidad' => 1,
        'estado' => 1,
    ]);

    \App\Models\PedidoReferencia::create([
        'pedido_id' => $pedido->id,
        'sistema_id' => $sistema->id,
        'lista_id' => $lista->id,
        'definicion' => 'Filtro de Aceite',
        'cantidad' => 2,
        'estado' => 1,
    ]);

    $response = $this->actingAs($this->analista, 'sanctum')
        ->getJson("/v1/pedidos/{$pedido->id}");

    $response->assertStatus(200);
    $referencias = $response->json('data.referencias');

    expect($referencias)->toHaveCount(2);
});

it('permite guardar análisis con items similares separados', function () {
    $sistema = \App\Models\Sistema::create(['nombre' => 'SISTEMA TEST']);
    $lista = \App\Models\Lista::factory()->create(['tipo' => 'Categoría Comercial']);
    $ref1 = \App\Models\Referencia::factory()->create();
    $ref2 = \App\Models\Referencia::factory()->create();
    $pedido = \App\Models\Pedido::factory()->create(['estado' => 'En_Analisis']);

    $payload = [
        'referencias' => [
            [
                'id' => null,
                'referencia_id' => $ref1->id,
                'sistema_id' => $sistema->id,
                'lista_id' => $lista->id,
                'cantidad' => 1,
                'definicion' => 'Item Similar',
                'estado' => 1,
            ],
            [
                'id' => null,
                'referencia_id' => $ref2->id,
                'sistema_id' => $sistema->id,
                'lista_id' => $lista->id,
                'cantidad' => 2,
                'definicion' => 'Item Similar',
                'estado' => 1,
            ],
        ],
    ];

    $response = $this->actingAs($this->analista, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", $payload);

    $response->assertStatus(200);

    expectDatabaseCount('pedido_referencia', 2);
    andDatabaseHas('pedido_referencia', ['cantidad' => 1, 'definicion' => 'Item Similar']);
    andDatabaseHas('pedido_referencia', ['cantidad' => 2, 'definicion' => 'Item Similar']);
});
