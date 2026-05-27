<?php

/**
 * Tests de guardar-costeo y metadatos de flete por proveedor
 */

use App\Models\Articulo;
use App\Models\Country;
use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use App\Models\Tercero;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    $this->admin = createUserWithRole('Administrador');
    Empresa::create(['nombre' => 'HM Test', 'trm' => 4000, 'flete' => 2.2, 'estado' => 1]);
});

it('guardar costeo con proveedor internacional sin flete devuelve missing_freight_rate', function () {
    $usa = Country::factory()->create(['iso2' => 'US', 'flete' => null]);
    $proveedor = Tercero::factory()->create(['country_id' => $usa->id]);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'user_id' => $this->admin->id,
    ]);
    $articulo = Articulo::factory()->create(['peso' => 500]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/guardar-costeo", [
            'referencias' => [
                [
                    'id' => $pedidoRef->id,
                    'proveedores' => [
                        [
                            'proveedor_id' => $proveedor->id,
                            'dias_entrega' => 5,
                            'costo_unidad' => 100,
                            'utilidad' => 10,
                            'cantidad' => 1,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    expect($response->status())->toBe(200, (string) ($response->json('error') ?? $response->getContent()));

    $response->assertJsonPath('missing_freight_rate', true)
        ->assertJson(fn ($json) => count($json['country_ids_sin_flete'] ?? []) >= 1);
});

it('guardar costeo con proveedor internacional con flete no marca missing_freight_rate', function () {
    $usa = Country::factory()->create(['iso2' => 'US', 'flete' => 3.0]);
    $proveedor = Tercero::factory()->create(['country_id' => $usa->id]);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'user_id' => $this->admin->id,
    ]);
    $articulo = Articulo::factory()->create(['peso' => 500]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/guardar-costeo", [
            'referencias' => [
                [
                    'id' => $pedidoRef->id,
                    'proveedores' => [
                        [
                            'proveedor_id' => $proveedor->id,
                            'dias_entrega' => 5,
                            'costo_unidad' => 100,
                            'utilidad' => 10,
                            'cantidad' => 1,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    expect($response->status())->toBe(200, (string) ($response->json('error') ?? $response->getContent()));

    $response->assertJsonPath('missing_freight_rate', false);
});
