<?php

use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use App\Models\Referencia;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\QueryException;

function crearDetalleRecepcionParaMovimiento(): RecepcionCompraDetalle
{
    $ordenCompra = OrdenCompra::factory()->create();
    $usuario = User::factory()->create();
    $referencia = Referencia::factory()->create();

    $ordenCompraReferencia = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 10,
        'valor_unitario' => 100,
        'valor_total' => 1000,
    ]);

    $recepcion = RecepcionCompra::create([
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => $usuario->id,
        'fecha_recepcion' => now(),
        'estado' => RecepcionCompra::ESTADO_ACTIVA,
    ]);

    return RecepcionCompraDetalle::create([
        'recepcion_compra_id' => $recepcion->id,
        'orden_compra_detalle_id' => $ordenCompraReferencia->id,
        'cantidad_recibida' => 5,
        'cantidad_conforme' => 5,
        'cantidad_rechazada' => 0,
    ]);
}

it('resuelve la relacion polimorfica origen de un movimiento de stock', function () {
    $detalle = crearDetalleRecepcionParaMovimiento();

    $movimiento = StockMovement::create([
        'referencia_id' => $detalle->ordenCompraDetalle->referencia_id,
        'cantidad' => 5,
        'tipo_movimiento' => StockMovement::ENTRADA,
        'origen_type' => RecepcionCompraDetalle::class,
        'origen_id' => $detalle->id,
    ]);

    expect($movimiento->origen)->toBeInstanceOf(RecepcionCompraDetalle::class)
        ->and($movimiento->origen->id)->toBe($detalle->id)
        ->and($movimiento->referencia)->toBeInstanceOf(Referencia::class);
});

it('rechaza duplicar el mismo movimiento por indice unico (idempotencia)', function () {
    $detalle = crearDetalleRecepcionParaMovimiento();

    $payload = [
        'referencia_id' => $detalle->ordenCompraDetalle->referencia_id,
        'cantidad' => 5,
        'tipo_movimiento' => StockMovement::ENTRADA,
        'origen_type' => RecepcionCompraDetalle::class,
        'origen_id' => $detalle->id,
    ];

    StockMovement::create($payload);

    expect(fn () => StockMovement::create($payload))->toThrow(QueryException::class);
});
