<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use App\Models\User;
use App\Services\RecepcionCompraService;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = app(RecepcionCompraService::class);
    $this->usuario = User::factory()->create();
});

function crearOcConLinea(OrdenCompraEstado $estado, int $cantidad = 10): array
{
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => $estado->value,
        'color' => $estado->color(),
    ]);

    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => $cantidad,
        'valor_unitario' => 100,
        'valor_total' => $cantidad * 100,
    ]);

    return [$ordenCompra, $detalle];
}

it('registra una recepción sin orden de trabajo asociada', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Despachada);

    $recepcion = $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'numero_remision' => 'REM-100',
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 6, 'cantidad_conforme' => 6, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    expect($recepcion->orden_trabajo_id)->toBeNull()
        ->and($recepcion->estado)->toBe('Activa');

    $this->assertDatabaseHas('orden_compra_referencia', [
        'id' => $detalle->id,
        'cantidad_recibida' => 6,
    ]);

    expect($ordenCompra->fresh()->estado)->toBe(OrdenCompraEstado::RecibidaParcialmente->value);
});

it('acumula dos entregas sobre la misma línea y cierra la OC como recibida', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Despachada, 10);

    $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 6, 'cantidad_conforme' => 6, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    $this->service->registrarDesdeOrdenCompra($ordenCompra->fresh(), [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 4, 'cantidad_conforme' => 4, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    $this->assertDatabaseHas('orden_compra_referencia', [
        'id' => $detalle->id,
        'cantidad_recibida' => 10,
    ]);

    expect($ordenCompra->fresh()->estado)->toBe(OrdenCompraEstado::Recibida->value);
});

it('rechaza sobre-recepción por encima de lo ordenado', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Despachada, 10);

    $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 8, 'cantidad_conforme' => 8, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    expect(fn () => $this->service->registrarDesdeOrdenCompra($ordenCompra->fresh(), [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 3, 'cantidad_conforme' => 3, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario))->toThrow(ValidationException::class);
});

it('rechaza líneas duplicadas en el mismo payload', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Despachada, 10);

    expect(fn () => $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario))->toThrow(ValidationException::class);
});

it('rechaza registrar recepción cuando la OC está en Generada', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Generada, 10);

    expect(fn () => $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario))->toThrow(ValidationException::class);
});

it('rechaza registrar recepción cuando la OC está Cancelada', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Cancelada, 10);

    expect(fn () => $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario))->toThrow(ValidationException::class);
});

it('permite registrar recepción cuando la OC está Despachada', function () {
    [$ordenCompra, $detalle] = crearOcConLinea(OrdenCompraEstado::Despachada, 10);

    $recepcion = $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 10, 'cantidad_conforme' => 10, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    expect($recepcion)->not->toBeNull();
});
