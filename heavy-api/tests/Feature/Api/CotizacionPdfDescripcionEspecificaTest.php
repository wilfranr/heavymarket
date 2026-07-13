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

it('muestra descripcion especifica del articulo en la tabla de items del PDF de cotizacion', function () {
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);
    $pedido = Pedido::factory()->create([
        'tercero_id' => $cliente->id,
        'estado' => 'Cotizado',
    ]);

    $articulo = Articulo::factory()->create([
        'definicion' => 'Pieza estándar genérica que no debe mostrarse',
        'descripcionEspecifica' => 'Descripcion especifica comercial para el cliente',
    ]);

    $referencia = Referencia::factory()
        ->withArticulo($articulo)
        ->create(['referencia' => 'REF-DESC-ESP']);

    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 2,
    ]);

    $marca = Lista::factory()->create([
        'tipo' => 'Marcas',
        'nombre' => 'Marca PDF',
    ]);

    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor']);

    $pedidoReferenciaProveedor = PedidoReferenciaProveedor::query()->create([
        'pedido_referencia_id' => $pedidoReferencia->id,
        'referencia_id' => $referencia->id,
        'proveedor_id' => $proveedor->id,
        'marca_id' => $marca->id,
        'dias_entrega' => 15,
        'es_backorder' => false,
        'costo_unidad' => 100,
        'utilidad' => 20,
        'valor_unidad' => 120,
        'valor_total' => 240,
        'ubicacion' => 'Nacional',
        'estado' => 1,
        'cantidad' => 2,
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
        ->toContain('DESCRIPCION ESPECIFICA COMERCIAL PARA EL CLIENTE')
        ->not->toContain('PIEZA ESTÁNDAR GENÉRICA QUE NO DEBE MOSTRARSE');
});
