<?php

use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\Tercero;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para Cotizaciones
 */
beforeEach(function () {
    Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);

    $this->admin = createUserWithRole('Administrador');
    $this->analista = createUserWithRole('Analista');
    $this->vendedor = createUserWithRole('Vendedor');
});

it('requiere autenticación para listar cotizaciones', function () {
    $this->getJson('/v1/cotizaciones')->assertStatus(401);
});

it('admin puede listar cotizaciones', function () {
    Cotizacion::factory()->count(3)->create();

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
    Cotizacion::factory()->enviada()->count(2)->create();
    Cotizacion::factory()->aprobada()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->getJson('/v1/cotizaciones?estado=Enviada');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(2);
});

it('permite ver detalle de cotización', function () {
    $cotizacion = Cotizacion::factory()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->getJson("/v1/cotizaciones/{$cotizacion->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['id', 'estado', 'total', 'pedido_id'],
        ]);
});

it('permite crear cotización', function () {
    $pedido = Pedido::factory()->create();

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
    $cotizacion = Cotizacion::factory()->pendiente()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
            'estado' => 'Enviada',
            'observaciones' => 'Cotización enviada al cliente',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.estado', 'Enviada');
});

it('admin puede eliminar cotización', function () {
    $cotizacion = Cotizacion::factory()->create();

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/v1/cotizaciones/{$cotizacion->id}")->assertStatus(204);
});

it('analista puede ver cotizaciones', function () {
    $cotizacion = Cotizacion::factory()->create();

    $this->actingAs($this->analista, 'sanctum')
        ->getJson("/v1/cotizaciones/{$cotizacion->id}")->assertStatus(200);
});

it('vendedor puede ver sus cotizaciones', function () {
    $cotizacion = Cotizacion::factory()->create(['user_id' => $this->vendedor->id]);

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
    $cotizacion = Cotizacion::factory()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
            'estado' => 'EstadoInvalido',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['estado']);
});

it('aprueba parcialmente referencias de una cotización y totaliza solo los ítems seleccionados', function () {
    $cliente = Tercero::factory()->create(['tipo' => 'Cliente']);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor']);
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $cliente->id,
        'user_id' => $this->vendedor->id,
    ]);

    $cotizacion = Cotizacion::factory()->create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $cliente->id,
        'user_id' => $this->vendedor->id,
        'estado' => 'Enviada',
        'total' => 150000,
    ]);

    $items = collect([10000, 20000, 30000, 40000, 50000])->map(function (int $valorTotal) use ($pedido, $proveedor, $cotizacion) {
        $referencia = Referencia::factory()->create();
        $pedidoReferencia = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'referencia_id' => $referencia->id,
            'cantidad' => 1,
        ]);
        $prp = PedidoReferenciaProveedor::create([
            'pedido_referencia_id' => $pedidoReferencia->id,
            'proveedor_id' => $proveedor->id,
            'referencia_id' => $referencia->id,
            'cantidad' => 1,
            'valor_unidad' => $valorTotal,
            'valor_total' => $valorTotal,
        ]);

        return CotizacionReferenciaProveedor::create([
            'cotizacion_id' => $cotizacion->id,
            'pedido_referencia_proveedor_id' => $prp->id,
            'mostrar_referencia' => true,
            'snapshot_valor_total' => $valorTotal,
        ]);
    })->values();

    $aprobadas = $items->take(3)->pluck('id')->all();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/cotizaciones/{$cotizacion->id}/approve", [
            'referencia_ids' => $aprobadas,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Aprobada')
        ->assertJsonPath('data.total', 60000);

    expect((float) $cotizacion->fresh()->total)->toBe(60000.0);
    expect(CotizacionReferenciaProveedor::whereIn('id', $aprobadas)->where('estado_aprobacion', 'Aprobada')->count())->toBe(3);
    expect(CotizacionReferenciaProveedor::whereIn('id', $items->skip(3)->pluck('id'))->where('estado_aprobacion', 'Rechazada')->count())->toBe(2);
    expect(OrdenTrabajoReferencia::count())->toBe(3);
    expect(OrdenCompraReferencia::count())->toBe(3);
});

it('rechaza aprobación parcial con referencias que no pertenecen a la cotización', function () {
    $cotizacion = Cotizacion::factory()->enviada()->create();
    $otraCotizacion = Cotizacion::factory()->enviada()->create();
    $pedidoReferenciaExterna = PedidoReferencia::factory()->create();
    $prpExterno = PedidoReferenciaProveedor::create([
        'pedido_referencia_id' => $pedidoReferenciaExterna->id,
        'proveedor_id' => Tercero::factory()->create(['tipo' => 'Proveedor'])->id,
        'referencia_id' => $pedidoReferenciaExterna->referencia_id,
        'cantidad' => 1,
        'valor_unidad' => 10000,
        'valor_total' => 10000,
    ]);
    $itemExterno = CotizacionReferenciaProveedor::create([
        'cotizacion_id' => $otraCotizacion->id,
        'pedido_referencia_proveedor_id' => $prpExterno->id,
        'mostrar_referencia' => true,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/cotizaciones/{$cotizacion->id}/approve", [
            'referencia_ids' => [$itemExterno->id],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['referencia_ids.0']);
});
