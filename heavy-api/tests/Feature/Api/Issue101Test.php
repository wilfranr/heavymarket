<?php

use App\Models\Lista;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use App\Models\Sistema;
use Spatie\Permission\Models\Role;

/**
 * Tests para Issue #101 - Items con mismo metadata pero diferente cantidad
 */
beforeEach(function () {
    Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
    $this->analista = createUserWithRole('Analista');
});

it('API retorna items con mismo metadata pero diferente cantidad', function () {
    $sistema = Sistema::create(['nombre' => 'SISTEMA TEST']);
    $lista = Lista::factory()->create(['tipo' => 'Categoría Comercial']);
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

    PedidoReferencia::create([
        'pedido_id' => $pedido->id,
        'sistema_id' => $sistema->id,
        'lista_id' => $lista->id,
        'definicion' => 'Filtro de Aceite',
        'cantidad' => 1,
        'estado' => 1,
    ]);

    PedidoReferencia::create([
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
    $sistema = Sistema::create(['nombre' => 'SISTEMA TEST']);
    $lista = Lista::factory()->create(['tipo' => 'Categoría Comercial']);
    $ref1 = Referencia::factory()->create();
    $ref2 = Referencia::factory()->create();
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

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
