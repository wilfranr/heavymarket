<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\Pedido;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->vendedor = createUserWithRole('Vendedor');
});

it('registra una recepción parcial desde la orden de trabajo y actualiza la OC', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoRecepcionCompra(10, OrdenCompraEstado::Confirmada);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/recepciones-compra", [
            'orden_compra_id' => $ordenCompra->id,
            'fecha_recepcion' => now()->toISOString(),
            'numero_remision' => 'REM-001',
            'observaciones' => 'Una unidad llegó golpeada',
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 6,
                    'cantidad_conforme' => 5,
                    'cantidad_rechazada' => 1,
                    'motivo_rechazo' => 'Una unidad llegó golpeada',
                ],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.orden_trabajo_id', $ordenTrabajo->id)
        ->assertJsonPath('data.orden_compra_id', $ordenCompra->id)
        ->assertJsonPath('data.detalles.0.cantidad_recibida', 6)
        ->assertJsonPath('data.detalles.0.cantidad_conforme', 5)
        ->assertJsonPath('data.detalles.0.cantidad_rechazada', 1);

    $this->assertDatabaseHas('recepciones_compra', [
        'orden_trabajo_id' => $ordenTrabajo->id,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => $this->logistica->id,
        'numero_remision' => 'REM-001',
        'estado' => 'Activa',
    ]);

    $this->assertDatabaseHas('recepcion_compra_detalles', [
        'orden_compra_detalle_id' => $detalle->id,
        'cantidad_recibida' => 6,
        'cantidad_conforme' => 5,
        'cantidad_rechazada' => 1,
    ]);

    expect($ordenCompra->fresh()->estado)->toBe(OrdenCompraEstado::RecibidaParcialmente->value);
});

it('acumula una segunda recepción y marca la OC como recibida cuando la cantidad conforme completa lo ordenado', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoRecepcionCompra(10, OrdenCompraEstado::Confirmada);

    registrarRecepcionDesdeOt($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 6, conforme: 5, rechazada: 1);
    registrarRecepcionDesdeOt($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 5, conforme: 5, rechazada: 0);

    expect($ordenCompra->fresh()->estado)->toBe(OrdenCompraEstado::Recibida->value)
        ->and($ordenCompra->fresh()->fecha_recepcion)->not->toBeNull();
});

it('rechaza cantidad conforme acumulada mayor a la ordenada', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoRecepcionCompra(10, OrdenCompraEstado::Confirmada);

    registrarRecepcionDesdeOt($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 8, conforme: 8, rechazada: 0);

    $response = registrarRecepcionDesdeOt($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 3, conforme: 3, rechazada: 0);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('detalles');
});

it('exige motivo cuando hay cantidad rechazada', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoRecepcionCompra(10, OrdenCompraEstado::Confirmada);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/recepciones-compra", [
            'orden_compra_id' => $ordenCompra->id,
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 1,
                    'cantidad_conforme' => 0,
                    'cantidad_rechazada' => 1,
                ],
            ],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('detalles.0.motivo_rechazo');
});

it('restringe el registro de recepción a logística o administración', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoRecepcionCompra(10, OrdenCompraEstado::Confirmada);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/recepciones-compra", [
            'orden_compra_id' => $ordenCompra->id,
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 1,
                    'cantidad_conforme' => 1,
                    'cantidad_rechazada' => 0,
                ],
            ],
        ]);

    $response->assertForbidden();
});

function crearFlujoRecepcionCompra(int $cantidadOrdenada, OrdenCompraEstado $estado): array
{
    $pedido = Pedido::factory()->create();
    $ordenTrabajo = OrdenTrabajo::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
    ]);
    $ordenCompra = OrdenCompra::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => $estado->value,
        'color' => $estado->color(),
    ]);
    $referencia = Referencia::factory()->create();
    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidadOrdenada,
        'valor_unitario' => 100,
        'valor_total' => $cantidadOrdenada * 100,
    ]);

    return [$ordenTrabajo, $ordenCompra, $detalle];
}

function registrarRecepcionDesdeOt(
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
