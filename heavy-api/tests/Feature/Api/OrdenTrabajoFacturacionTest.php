<?php

use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Contabilidad', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->contabilidad = createUserWithRole('Contabilidad');
    $this->logistica = createUserWithRole('Logistica');
});

it('rechaza facturar una OT que no está Lista para Facturar', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'En Proceso');

    $response = $this->actingAs($this->contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", [
            'numero_factura' => 'FE-001',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('orden_trabajo');
});

it('exige numero_factura para facturar', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'Lista para Facturar');

    $response = $this->actingAs($this->contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('numero_factura');
});

it('factura una OT Lista para Facturar y la cierra', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'Lista para Facturar');

    $response = $this->actingAs($this->contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", [
            'numero_factura' => 'FE-00123',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Cerrada')
        ->assertJsonPath('data.numero_factura', 'FE-00123');

    $ordenTrabajo->refresh();

    expect($ordenTrabajo->estado)->toBe('Cerrada')
        ->and($ordenTrabajo->facturado_por)->toBe($this->contabilidad->id)
        ->and($ordenTrabajo->facturado_at)->not->toBeNull();
});

it('rechaza facturar dos veces la misma orden de trabajo', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'Lista para Facturar');

    $this->actingAs($this->contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", ['numero_factura' => 'FE-001'])
        ->assertOk();

    $response = $this->actingAs($this->contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", ['numero_factura' => 'FE-002']);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('orden_trabajo');
});

it('restringe facturar a Contabilidad, Administrador o super_admin', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'Lista para Facturar');

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/facturar", ['numero_factura' => 'FE-001']);

    $response->assertForbidden();
});

it('el resumen de facturacion excluye del total la cantidad depurada', function () {
    $pedido = Pedido::factory()->create();
    $referencia = Referencia::factory()->create(['referencia' => 'ALT-900']);

    $ordenTrabajo = OrdenTrabajo::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => 'Lista para Facturar',
    ]);

    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 10,
    ]);

    PedidoReferenciaProveedor::create([
        'pedido_referencia_id' => $pedidoReferencia->id,
        'referencia_id' => $referencia->id,
        'valor_unidad' => 1000,
        'estado' => 1,
        'cantidad' => 10,
    ]);

    OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
        'cantidad_cotizada' => 10,
        'cantidad_recibida' => 7,
        'cantidad_depurada' => 3,
        'estado' => 'Recibido',
        'recibido' => true,
    ]);

    $response = $this->actingAs($this->contabilidad, 'sanctum')
        ->getJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/resumen-facturacion");

    $response->assertOk()
        ->assertJsonPath('lineas.0.cantidad_facturable', 7)
        ->assertJsonPath('lineas.0.cantidad_depurada', 3)
        ->assertJsonPath('lineas.0.subtotal', 7000)
        ->assertJsonPath('total', 7000);
});

it('restringe el resumen de facturacion a roles autorizados', function () {
    $ordenTrabajo = crearOtParaFacturar(estado: 'Lista para Facturar');

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/resumen-facturacion");

    $response->assertForbidden();
});

function crearOtParaFacturar(string $estado): OrdenTrabajo
{
    $pedido = Pedido::factory()->create();

    return OrdenTrabajo::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => $estado,
    ]);
}
