<?php

declare(strict_types=1);

use App\Models\Articulo;
use App\Models\Empresa;
use App\Models\Lista;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\Tercero;
use App\Services\CotizacionService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

it('descarga el PDF de una orden de trabajo con referencia completa (articulo, marca y proveedor aprobado)', function () {
    $user = createUserWithRole('Administrador');

    $marca = Lista::create(['nombre' => 'Caterpillar', 'tipo' => 'Fabricantes']);
    $articulo = Articulo::factory()->create([
        'definicion' => 'Tuerca Hexagonal',
        'descripcionEspecifica' => 'Tuerca Hexagonal (3/8)',
    ]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id, 'marca_id' => $marca->id]);
    $pedidoReferencia = PedidoReferencia::factory()->create(['referencia_id' => $referencia->id]);
    PedidoReferenciaProveedor::create([
        'pedido_referencia_id' => $pedidoReferencia->id,
        'referencia_id' => $referencia->id,
        'proveedor_id' => Tercero::factory()->create()->id,
        'marca_id' => $marca->id,
        'dias_entrega' => 0,
        'estado' => 1,
        'valor_unidad' => 4240,
        'valor_total' => 4240,
        'cantidad' => 1,
    ]);

    $ordenTrabajo = OrdenTrabajo::factory()->create();
    OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
        'cantidad_cotizada' => 7,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->get("/v1/ordenes-trabajo/{$ordenTrabajo->id}/download-pdf");

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
});

it('descarga el PDF de una orden de trabajo con una referencia sin articulo ni proveedores', function () {
    $user = createUserWithRole('Administrador');

    $pedidoReferencia = PedidoReferencia::factory()->create(['definicion' => 'Repuesto sin catalogar']);
    $ordenTrabajo = OrdenTrabajo::factory()->create();
    OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->get("/v1/ordenes-trabajo/{$ordenTrabajo->id}/download-pdf");

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
});

it('el PDF de la orden de trabajo muestra la descripcion del articulo y no muestra precios', function () {
    $articulo = Articulo::factory()->create([
        'definicion' => 'Tuerca Hexagonal',
        'descripcionEspecifica' => 'Tuerca Hexagonal (3/8)',
    ]);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoReferencia = PedidoReferencia::factory()->create(['referencia_id' => $referencia->id]);

    $ordenTrabajo = OrdenTrabajo::factory()->create();
    OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
        'cantidad_cotizada' => 7,
    ]);

    $html = app(CotizacionService::class)->generarPDFOrdenTrabajo($ordenTrabajo->fresh())->output();

    expect($html)->not->toBeEmpty();

    $view = view('pdf.orden_trabajo', [
        'ordenTrabajo' => $ordenTrabajo->fresh()->load([
            'tercero',
            'pedido.maquina',
            'transportadora',
            'direccion',
            'referencias.pedidoReferencia.referencia.articulo',
            'referencias.pedidoReferencia.referencia.marca',
            'referencias.pedidoReferencia.marca',
            'referencias.pedidoReferencia.proveedores.marca',
        ]),
        'empresa' => Empresa::first(),
    ])->render();

    expect($view)->toContain('TUERCA HEXAGONAL (3/8)');
    expect($view)->not->toContain('Subtotal');
    expect($view)->not->toContain('IVA');
    expect($view)->not->toContain('Precio');
});

it('el detalle de la orden de trabajo expone el articulo de la referencia', function () {
    $user = createUserWithRole('Administrador');

    $articulo = Articulo::factory()->create(['descripcionEspecifica' => 'Tuerca Hexagonal (3/8)']);
    $referencia = Referencia::factory()->create(['articulo_id' => $articulo->id]);
    $pedidoReferencia = PedidoReferencia::factory()->create(['referencia_id' => $referencia->id]);

    $ordenTrabajo = OrdenTrabajo::factory()->create();
    OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}");

    $response->assertOk();
    $response->assertJsonPath(
        'data.referencias.0.pedido_referencia.referencia.articulo.descripcionEspecifica',
        'Tuerca Hexagonal (3/8)'
    );
});
