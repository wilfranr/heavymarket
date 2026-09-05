<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use App\Services\OrdenTrabajoDepuracionService;
use App\Services\OrdenTrabajoLifecycleService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->vendedor = createUserWithRole('Vendedor');
});

it('deja la OT en En Proceso si una línea todavía no completa recibida + depurada', function () {
    [$ordenTrabajo, $ordenCompra, $detalle, $referenciaOt] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcionCierre($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 6, conforme: 6, rechazada: 0);

    expect($ordenTrabajo->fresh()->estado)->toBe('En Proceso');
});

it('transiciona la OT a Lista para Facturar cuando la recepción completa la cantidad cotizada', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcionCierre($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 10, conforme: 10, rechazada: 0);

    expect($ordenTrabajo->fresh()->estado)->toBe('Lista para Facturar');
});

it('transiciona a Lista para Facturar cuando la depuración explica el saldo pendiente', function () {
    [$ordenTrabajo, $ordenCompra, $detalle, $referenciaOt] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcionCierre($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 7, conforme: 7, rechazada: 0);
    expect($ordenTrabajo->fresh()->estado)->toBe('En Proceso');

    app(OrdenTrabajoDepuracionService::class)->depurarFaltante(
        $referenciaOt->fresh(),
        ['cantidad_depurada' => 3, 'motivo_depuracion' => 'Proveedor no repone el saldo'],
        $this->vendedor
    );

    expect($ordenTrabajo->fresh()->estado)->toBe('Lista para Facturar');
});

it('el endpoint de completitud detalla el cumplimiento por línea', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcionCierre($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 6, conforme: 6, rechazada: 0);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}/completitud");

    $response->assertOk()
        ->assertJsonPath('completa', false)
        ->assertJsonPath('lineas.0.cotizada', 10)
        ->assertJsonPath('lineas.0.recibida', 6)
        ->assertJsonPath('lineas.0.depurada', 0)
        ->assertJsonPath('lineas.0.cumple', false);
});

it('evaluarCompletitud es idempotente y no cambia nada en una segunda ejecución', function () {
    [$ordenTrabajo, $ordenCompra, $detalle] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    registrarRecepcionCierre($this, $ordenTrabajo, $ordenCompra, $detalle, recibida: 10, conforme: 10, rechazada: 0);

    $servicio = app(OrdenTrabajoLifecycleService::class);
    $servicio->evaluarCompletitud($ordenTrabajo->fresh());
    $servicio->evaluarCompletitud($ordenTrabajo->fresh());

    expect($ordenTrabajo->fresh()->estado)->toBe('Lista para Facturar');
});

it('no se puede forzar Lista para Facturar manualmente vía PUT', function () {
    [$ordenTrabajo] = crearFlujoCierre(cantidadCotizada: 10, cantidadOrdenada: 10);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->putJson("/v1/ordenes-trabajo/{$ordenTrabajo->id}", [
            'estado' => 'Lista para Facturar',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('estado');
});

/**
 * @return array{0: OrdenTrabajo, 1: OrdenCompra, 2: OrdenCompraReferencia, 3: OrdenTrabajoReferencia}
 */
function crearFlujoCierre(int $cantidadCotizada, int $cantidadOrdenada): array
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
        'cantidad_depurada' => 0,
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

function registrarRecepcionCierre(
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
