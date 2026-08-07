<?php

use App\Events\PurchaseOrderItemsReceived;
use App\Listeners\SyncStockOnPurchaseOrderReceived;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraDetalle;
use App\Models\Referencia;
use App\Models\StockMovement;
use App\Models\User;

function crearRecepcionActivaConDetalle(int $cantidadConforme): RecepcionCompra
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

    RecepcionCompraDetalle::create([
        'recepcion_compra_id' => $recepcion->id,
        'orden_compra_detalle_id' => $ordenCompraReferencia->id,
        'cantidad_recibida' => $cantidadConforme,
        'cantidad_conforme' => $cantidadConforme,
        'cantidad_rechazada' => 0,
    ]);

    return $recepcion->load(['detalles.ordenCompraDetalle.referencia']);
}

it('crea un StockMovement de entrada por cada línea conforme', function () {
    $recepcion = crearRecepcionActivaConDetalle(5);

    (new SyncStockOnPurchaseOrderReceived)->handle(new PurchaseOrderItemsReceived($recepcion));

    $detalle = $recepcion->detalles->first();

    $this->assertDatabaseHas('stock_movements', [
        'referencia_id' => $detalle->ordenCompraDetalle->referencia_id,
        'cantidad' => 5,
        'tipo_movimiento' => StockMovement::ENTRADA,
        'origen_type' => RecepcionCompraDetalle::class,
        'origen_id' => $detalle->id,
    ]);
});

it('no genera movimientos cuando cantidad_conforme es 0', function () {
    $recepcion = crearRecepcionActivaConDetalle(0);

    (new SyncStockOnPurchaseOrderReceived)->handle(new PurchaseOrderItemsReceived($recepcion));

    expect(StockMovement::count())->toBe(0);
});

it('es idempotente: procesar el mismo evento dos veces no duplica movimientos', function () {
    $recepcion = crearRecepcionActivaConDetalle(5);
    $listener = new SyncStockOnPurchaseOrderReceived;

    $listener->handle(new PurchaseOrderItemsReceived($recepcion));
    $listener->handle(new PurchaseOrderItemsReceived($recepcion));

    expect(StockMovement::count())->toBe(1);
});

it('no genera movimientos para una recepción anulada', function () {
    $recepcion = crearRecepcionActivaConDetalle(5);
    $recepcion->update(['estado' => RecepcionCompra::ESTADO_ANULADA]);

    (new SyncStockOnPurchaseOrderReceived)->handle(new PurchaseOrderItemsReceived($recepcion->fresh(['detalles.ordenCompraDetalle.referencia'])));

    expect(StockMovement::count())->toBe(0);
});
