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
use App\Models\TRM;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

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

    $response->assertOk()
        ->assertJsonPath('missing_freight_rate', true);

    expect($response->json('country_ids_sin_flete'))->not->toBeEmpty();
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

    $response->assertOk()
        ->assertJsonPath('missing_freight_rate', false);
});

it('guardar costeo persiste Backorder sin convertirlo en entrega inmediata', function () {
    $colombia = Country::factory()->create(['iso2' => 'CO']);
    $proveedor = Tercero::factory()->create(['country_id' => $colombia->id]);
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
                            'dias_entrega' => null,
                            'es_backorder' => true,
                            'costo_unidad' => 100,
                            'utilidad' => 10,
                            'cantidad' => 1,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.referencias.0.proveedores.0.dias_entrega', null)
        ->assertJsonPath('data.referencias.0.proveedores.0.es_backorder', true)
        ->assertJsonPath('data.referencias.0.proveedores.0.entrega_label', 'Backorder');

    $this->assertDatabaseHas('pedido_referencia_proveedor', [
        'pedido_referencia_id' => $pedidoRef->id,
        'dias_entrega' => null,
        'es_backorder' => true,
    ]);
});

it('guardar costeo exige días cuando la entrega no es Backorder', function () {
    $colombia = Country::factory()->create(['iso2' => 'CO']);
    $proveedor = Tercero::factory()->create(['country_id' => $colombia->id]);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'user_id' => $this->admin->id,
    ]);
    $referencia = Referencia::factory()->create();
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
                            'dias_entrega' => null,
                            'es_backorder' => false,
                            'costo_unidad' => 100,
                            'utilidad' => 10,
                            'cantidad' => 1,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('referencias.0.proveedores.0.dias_entrega');
});

it('guardar costeo rechaza omitir días y estado Backorder simultáneamente', function () {
    $colombia = Country::factory()->create(['iso2' => 'CO']);
    $proveedor = Tercero::factory()->create(['country_id' => $colombia->id]);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'user_id' => $this->admin->id,
    ]);
    $referencia = Referencia::factory()->create();
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
                            'costo_unidad' => 100,
                            'utilidad' => 10,
                            'cantidad' => 1,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('referencias.0.proveedores.0.es_backorder');
});

it('guardar costeo para proveedor internacional utiliza la TRM de la tabla trms y calcula correctamente', function () {
    // Arrange
    $trmReal = 4500.0;
    TRM::create([
        'trm' => $trmReal,
        'fecha' => now(),
    ]);

    $usa = Country::factory()->create(['iso2' => 'US', 'flete' => 2.0]);
    $proveedor = Tercero::factory()->create(['country_id' => $usa->id]);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'user_id' => $this->admin->id,
    ]);
    $articulo = Articulo::factory()->create(['peso' => 0.453592]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    // Act
    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/guardar-costeo", [
            'referencias' => [
                [
                    'id' => $pedidoRef->id,
                    'proveedores' => [
                        [
                            'proveedor_id' => $proveedor->id,
                            'dias_entrega' => 5,
                            'costo_unidad' => 10.00,
                            'utilidad' => 20.0,
                            'cantidad' => 2,
                            'seleccionado' => true,
                        ],
                    ],
                ],
            ],
        ]);

    // Assert
    $response->assertOk();

    $this->assertDatabaseHas('pedido_referencia_proveedor', [
        'pedido_referencia_id' => $pedidoRef->id,
        'proveedor_id' => $proveedor->id,
        'costo_unidad' => 10.00,
        'utilidad' => 20.0,
        'valor_unidad' => 64700.00,
        'valor_total' => 129400.00,
    ]);
})->skip(fn () => DB::connection()->getDriverName() !== 'mysql', 'El valor esperado depende del redondeo de la columna DECIMAL de MySQL; SQLite (tipado dinamico, sin DECIMAL real) almacena el resultado de round() de PHP sin ese ajuste adicional, dando un valor distinto en el limite exacto entre centenas.');
