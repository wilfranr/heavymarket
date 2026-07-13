<?php

/**
 * Tests de finalizar costeo y validación de flete por país del proveedor
 */

use App\Models\Articulo;
use App\Models\Cotizacion;
use App\Models\Country;
use App\Models\Empresa;
use App\Models\Lista;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\Tercero;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    Notification::fake();

    $this->admin = createUserWithRole('Administrador');
    Empresa::create(['nombre' => 'HM Test', 'trm' => 4000, 'flete' => 2.2, 'estado' => 1]);
});

it('formatea los plazos comerciales y Backorder para la cotización', function () {
    expect(PedidoReferenciaProveedor::make(['dias_entrega' => 15, 'es_backorder' => false])->entrega_label)
        ->toBe('8 a 15 días hábiles')
        ->and(PedidoReferenciaProveedor::make(['dias_entrega' => null, 'es_backorder' => true])->entrega_label)
        ->toBe('Backorder');
});

it('finalizar costeo sin flete deja cotización en Borrador y notifica', function () {
    $usa = Country::factory()->create(['name' => 'Estados Unidos', 'iso2' => 'US', 'flete' => null]);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor', 'country_id' => $usa->id]);
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);

    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $cliente->id,
        'user_id' => $this->admin->id,
    ]);

    $articulo = Articulo::factory()->create(['peso' => 500]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    $marca = Lista::factory()->create(['tipo' => 'Marcas']);

    $linea = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoRef->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => $marca->id,
        'ubicacion' => 'Internacional',
        'estado' => 1,
        'costo_unidad' => 100,
        'utilidad' => 10,
        'cantidad' => 1,
        'dias_entrega' => 5,
        'valor_unidad' => 1000,
        'valor_total' => 1000,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson('/v1/cotizaciones/finalizar-costeo', [
            'pedido_id' => $pedido->id,
            'items' => [
                ['id' => $linea->id, 'mostrar_referencia' => true],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Borrador')
        ->assertJsonPath('missing_freight_rate', true)
        ->assertJsonPath('cotizacion_estado', 'Borrador');

    expect($pedido->fresh()->estado)->toBe('En_Costeo');

    Notification::assertSentTo(
        $this->admin,
        SystemNotification::class,
        fn (SystemNotification $n) => $n->type === 'missing_freight_rate'
    );
});

it('finalizar costeo con flete configurado deja cotización Enviada', function () {
    $usa = Country::factory()->create(['name' => 'Estados Unidos', 'iso2' => 'US', 'flete' => 3.5]);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor', 'country_id' => $usa->id]);
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);

    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $cliente->id,
        'user_id' => $this->admin->id,
    ]);

    $articulo = Articulo::factory()->create(['peso' => 500]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    $marca = Lista::factory()->create(['tipo' => 'Marcas']);

    $linea = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoRef->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => $marca->id,
        'ubicacion' => 'Internacional',
        'estado' => 1,
        'costo_unidad' => 100,
        'utilidad' => 10,
        'cantidad' => 1,
        'dias_entrega' => 5,
        'valor_unidad' => 1000,
        'valor_total' => 1000,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson('/v1/cotizaciones/finalizar-costeo', [
            'pedido_id' => $pedido->id,
            'items' => [
                ['id' => $linea->id, 'mostrar_referencia' => true],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Enviada')
        ->assertJsonPath('missing_freight_rate', false);

    expect($pedido->fresh()->estado)->toBe('Cotizado');
});

it('finalizar costeo persiste observaciones comerciales de cotización', function () {
    $colombia = Country::factory()->create(['name' => 'Colombia', 'iso2' => 'CO', 'flete' => 0]);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor', 'country_id' => $colombia->id]);
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);

    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $cliente->id,
        'user_id' => $this->admin->id,
    ]);

    $articulo = Articulo::factory()->create(['peso' => 500]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoRef = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
    ]);

    $marca = Lista::factory()->create(['tipo' => 'Marcas']);

    $linea = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoRef->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => $marca->id,
        'ubicacion' => 'Nacional',
        'estado' => 1,
        'costo_unidad' => 100,
        'utilidad' => 10,
        'cantidad' => 1,
        'dias_entrega' => 5,
        'valor_unidad' => 1000,
        'valor_total' => 1000,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson('/v1/cotizaciones/finalizar-costeo', [
            'pedido_id' => $pedido->id,
            'items' => [
                ['id' => $linea->id, 'mostrar_referencia' => true],
            ],
            'observaciones' => '  Observación comercial desde costeo  ',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.observaciones', 'Observación comercial desde costeo');

    expect(Cotizacion::query()->where('pedido_id', $pedido->id)->latest('id')->first()?->observaciones)
        ->toBe('Observación comercial desde costeo');
});
