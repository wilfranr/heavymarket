<?php

use App\Models\Articulo;
use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\Lista;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;

uses(RefreshDatabase::class);

it('usa el snapshot comercial de la cotizacion en el PDF aunque cambie el costeo', function () {
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor', 'nombre' => 'Proveedor snapshot']);
    $pedido = Pedido::factory()->create([
        'tercero_id' => $cliente->id,
        'estado' => 'En_Costeo',
    ]);

    $articulo = Articulo::factory()->create([
        'definicion' => 'Definicion viva cambiada',
        'descripcionEspecifica' => 'Descripcion viva cambiada',
    ]);

    $referencia = Referencia::factory()
        ->withArticulo($articulo)
        ->create(['referencia' => 'REF-VIVA-CAMBIADA']);

    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 9,
    ]);

    $marca = Lista::factory()->create([
        'tipo' => 'Marcas',
        'nombre' => 'Marca viva cambiada',
    ]);

    $pedidoReferenciaProveedor = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoReferencia->id,
        'referencia_id' => $referencia->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => $marca->id,
        'dias_entrega' => 60,
        'costo_unidad' => 100,
        'utilidad' => 20,
        'valor_unidad' => 999,
        'valor_total' => 8991,
        'ubicacion' => 'Nacional',
        'estado' => 1,
        'cantidad' => 9,
    ]);

    $cotizacion = Cotizacion::factory()->create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $cliente->id,
        'user_id' => User::factory(),
        'total' => 240,
    ]);

    CotizacionReferenciaProveedor::query()->create([
        'cotizacion_id' => $cotizacion->id,
        'pedido_referencia_proveedor_id' => $pedidoReferenciaProveedor->id,
        'mostrar_referencia' => true,
        'snapshot_referencia' => 'REF-SNAPSHOT',
        'snapshot_descripcion' => 'Descripcion snapshot comercial',
        'snapshot_marca' => 'Marca Snapshot',
        'snapshot_entrega' => '8 a 15 días hábiles',
        'snapshot_cantidad' => 2,
        'snapshot_valor_unidad' => 120,
        'snapshot_valor_total' => 240,
    ]);

    $cotizacion->load([
        'pedido',
        'tercero',
        'user',
        'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo',
        'referenciasProveedores.pedidoReferenciaProveedor.marca',
    ]);

    $html = View::make('pdf.cotizacion', [
        'cotizacion' => $cotizacion,
        'empresa' => null,
    ])->render();

    expect($html)
        ->toContain('REF-SNAPSHOT')
        ->toContain('DESCRIPCION SNAPSHOT COMERCIAL')
        ->toContain('MARCA SNAPSHOT')
        ->toContain('8 A 15')
        ->toContain('120')
        ->toContain('240')
        ->not->toContain('REF-VIVA-CAMBIADA')
        ->not->toContain('DESCRIPCION VIVA CAMBIADA');
});

it('aprobar una cotizacion activa marca las otras como rechazadas y aprueba el pedido', function () {
    seedRoles();
    seedPermissions();

    $admin = createUserWithRole('Administrador');
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $cliente->id,
        'user_id' => $admin->id,
    ]);

    // Crear referencias necesarias para que no falle la aprobación
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor']);
    $referencia = Referencia::factory()->create();
    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 2,
    ]);
    $prp = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoReferencia->id,
        'referencia_id' => $referencia->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => Lista::factory()->create(['tipo' => 'Marcas'])->id,
        'dias_entrega' => 10,
        'costo_unidad' => 100,
        'utilidad' => 20,
        'valor_unidad' => 120,
        'valor_total' => 240,
        'ubicacion' => 'Nacional',
        'estado' => 1,
        'cantidad' => 2,
    ]);

    $seleccionada = Cotizacion::factory()->create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $cliente->id,
        'user_id' => $admin->id,
        'estado' => 'Enviada',
    ]);

    CotizacionReferenciaProveedor::query()->create([
        'cotizacion_id' => $seleccionada->id,
        'pedido_referencia_proveedor_id' => $prp->id,
        'mostrar_referencia' => true,
        'snapshot_referencia' => 'REF-SNAP',
        'snapshot_descripcion' => 'Desc',
        'snapshot_marca' => 'Marca',
        'snapshot_entrega' => 'Inmediata',
        'snapshot_cantidad' => 2,
        'snapshot_valor_unidad' => 120,
        'snapshot_valor_total' => 240,
    ]);

    $otra = Cotizacion::factory()->create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $cliente->id,
        'user_id' => $admin->id,
        'estado' => 'Enviada',
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/v1/cotizaciones/{$seleccionada->id}/approve");

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Aprobada')
        ->assertJsonPath('data.pedido.estado', 'Aprobado');

    expect($pedido->fresh()->estado)->toBe('Aprobado')
        ->and($seleccionada->fresh()->estado)->toBe('Aprobada')
        ->and($otra->fresh()->estado)->toBe('Rechazada');
});
