<?php

use App\Enums\EstadoRecepcion;
use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use App\Services\OrdenCompraLifecycleService;

beforeEach(function () {
    $this->service = app(OrdenCompraLifecycleService::class);
});

function crearOrdenCompraConDetalle(OrdenCompraEstado $estado, int $cantidad, int $cantidadRecibida): OrdenCompra
{
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => $estado->value,
        'color' => $estado->color(),
    ]);

    OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => $cantidad,
        'cantidad_recibida' => $cantidadRecibida,
        'valor_unitario' => 100,
        'valor_total' => $cantidad * 100,
    ]);

    return $ordenCompra->fresh(['detalles']);
}

it('retorna EnTransito cuando nada se ha recibido', function () {
    $ordenCompra = crearOrdenCompraConDetalle(OrdenCompraEstado::Enviada, 10, 0);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBe(EstadoRecepcion::EnTransito);
});

it('retorna RecibidaParcial cuando lo recibido es menor a lo ordenado', function () {
    $ordenCompra = crearOrdenCompraConDetalle(OrdenCompraEstado::Despachada, 10, 4);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBe(EstadoRecepcion::RecibidaParcial);
});

it('retorna Recibida cuando lo recibido iguala lo ordenado', function () {
    $ordenCompra = crearOrdenCompraConDetalle(OrdenCompraEstado::RecibidaParcialmente, 10, 10);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBe(EstadoRecepcion::Recibida);
});

it('retorna null cuando la OC aún no ha sido despachada (Generada)', function () {
    $ordenCompra = crearOrdenCompraConDetalle(OrdenCompraEstado::Generada, 10, 0);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBeNull();
});

it('retorna null cuando la OC está en estado Pagada', function () {
    $ordenCompra = crearOrdenCompraConDetalle(OrdenCompraEstado::Pagada, 10, 0);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBeNull();
});

it('retorna null cuando la OC no tiene ítems', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Enviada->value,
        'color' => OrdenCompraEstado::Enviada->color(),
    ])->fresh(['detalles']);

    expect($this->service->calcularEstadoRecepcion($ordenCompra))->toBeNull();
});
