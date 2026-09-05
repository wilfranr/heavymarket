<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
});

it('sincroniza cantidad_recibida en la referencia de la OT tras una recepción parcial', function () {
    [$ordenTrabajo, $ordenCompra, $detalle, $referenciaOt] = crearFlujoConReferenciaOt(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcion($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 6, conforme: 5, rechazada: 1);

    $referenciaOt->refresh();

    expect($referenciaOt->cantidad_recibida)->toBe(5)
        ->and($referenciaOt->estado)->toBe('Pendiente')
        ->and($referenciaOt->recibido)->toBeFalse()
        ->and($ordenTrabajo->fresh()->estado)->toBe('En Proceso');
});

it('marca la referencia de la OT como Recibido cuando la cantidad conforme completa lo cotizado', function () {
    [$ordenTrabajo, $ordenCompra, $detalle, $referenciaOt] = crearFlujoConReferenciaOt(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcion($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 10, conforme: 10, rechazada: 0);

    $referenciaOt->refresh();

    expect($referenciaOt->cantidad_recibida)->toBe(10)
        ->and($referenciaOt->estado)->toBe('Recibido')
        ->and($referenciaOt->recibido)->toBeTrue();
});

it('no mueve el estado de la OT si no hay ninguna referencia con recepción registrada', function () {
    [$ordenTrabajo] = crearFlujoConReferenciaOt(cantidadCotizada: 10, cantidadOrdenada: 10);

    expect($ordenTrabajo->fresh()->estado)->toBe('Pendiente');
});

it('expone el bloque progreso calculado en el recurso de la OT', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoConReferenciaOt(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcion($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 4, conforme: 4, rechazada: 0);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}");

    $response->assertOk()
        ->assertJsonPath('data.progreso.cotizado', 10)
        ->assertJsonPath('data.progreso.recibido', 4)
        ->assertJsonPath('data.progreso.porcentaje', 40);
});

it('no falla al registrar una recepción directa desde la OC sin Orden de Trabajo asociada', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'pedido_id' => null,
        'cotizacion_id' => null,
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);
    $referencia = Referencia::factory()->create();
    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 5,
        'valor_unitario' => 100,
        'valor_total' => 500,
    ]);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 5,
                    'cantidad_conforme' => 5,
                    'cantidad_rechazada' => 0,
                ],
            ],
        ]);

    $response->assertCreated();
});

/**
 * @return array{0: OrdenTrabajo, 1: OrdenCompra, 2: OrdenCompraReferencia, 3: OrdenTrabajoReferencia}
 */
function crearFlujoConReferenciaOt(int $cantidadCotizada, int $cantidadOrdenada): array
{
    $pedido = Pedido::factory()->create();
    $referencia = Referencia::factory()->create();

    $ordenTrabajo = OrdenTrabajo::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => 'Pendiente',
    ]);

    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidadCotizada,
    ]);

    $referenciaOt = OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
        'cantidad_cotizada' => $cantidadCotizada,
        'cantidad_recibida' => 0,
        'estado' => 'Pendiente',
        'recibido' => false,
    ]);

    $ordenCompra = OrdenCompra::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);

    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidadOrdenada,
        'valor_unitario' => 100,
        'valor_total' => $cantidadOrdenada * 100,
    ]);

    return [$ordenTrabajo, $ordenCompra, $detalle, $referenciaOt];
}

function registrarRecepcion(
    mixed $test,
    OrdenTrabajo $ordenTrabajo,
    OrdenCompra $ordenCompra,
    OrdenCompraReferencia $detalle,
    int $recibida,
    int $conforme,
    int $rechazada,
) {
    return $test->actingAs($test->logistica, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/recepciones-compra", [
            'orden_compra_id' => $ordenCompra->id,
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => $recibida,
                    'cantidad_conforme' => $conforme,
                    'cantidad_rechazada' => $rechazada,
                    'motivo_rechazo' => $rechazada > 0 ? 'Repuesto con novedad' : null,
                ],
            ],
        ]);
}
