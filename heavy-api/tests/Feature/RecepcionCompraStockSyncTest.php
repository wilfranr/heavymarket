<?php

use App\Enums\OrdenCompraEstado;
use App\Events\PurchaseOrderItemsReceived;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\RecepcionCompraService;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = app(RecepcionCompraService::class);
    $this->usuario = User::factory()->create();
});

function crearOcParaSyncStock(int $cantidad = 10): array
{
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Despachada->value,
        'color' => OrdenCompraEstado::Despachada->color(),
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

it('registrar una recepción despacha PurchaseOrderItemsReceived y sincroniza el stock', function () {
    [$ordenCompra, $detalle] = crearOcParaSyncStock();

    $recepcion = $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 5, 'cantidad_conforme' => 5, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario);

    $this->assertDatabaseHas('stock_movements', [
        'referencia_id' => $detalle->referencia_id,
        'cantidad' => 5,
        'tipo_movimiento' => StockMovement::ENTRADA,
    ]);
});

it('no dispara el evento cuando la validación falla antes de crear la recepción', function () {
    Event::fake([PurchaseOrderItemsReceived::class]);

    [$ordenCompra, $detalle] = crearOcParaSyncStock();

    expect(fn () => $this->service->registrarDesdeOrdenCompra($ordenCompra, [
        'fecha_recepcion' => now()->toISOString(),
        'detalles' => [
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
            ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 2, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 0],
        ],
    ], $this->usuario))->toThrow(ValidationException::class);

    Event::assertNotDispatched(PurchaseOrderItemsReceived::class);
    expect(StockMovement::count())->toBe(0);
});
