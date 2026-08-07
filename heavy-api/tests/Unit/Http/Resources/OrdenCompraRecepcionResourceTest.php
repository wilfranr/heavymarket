<?php

use App\Enums\OrdenCompraEstado;
use App\Http\Resources\OrdenCompraReferenciaResource;
use App\Http\Resources\OrdenCompraResource;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Illuminate\Http\Request;

it('expone estado_recepcion en OrdenCompraResource segun las cantidades recibidas', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Despachada->value,
        'color' => OrdenCompraEstado::Despachada->color(),
    ]);

    OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => 10,
        'cantidad_recibida' => 4,
        'valor_unitario' => 100,
        'valor_total' => 1000,
    ]);

    $array = (new OrdenCompraResource($ordenCompra->fresh(['detalles'])))->resolve(new Request);

    expect($array['estado_recepcion'])->toBe('Recibida parcialmente');
});

it('expone estado_recepcion null cuando la OC no ha sido despachada', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Generada->value,
        'color' => OrdenCompraEstado::Generada->color(),
    ]);

    $array = (new OrdenCompraResource($ordenCompra->fresh(['detalles'])))->resolve(new Request);

    expect($array['estado_recepcion'])->toBeNull();
});

it('expone estado_item y saldo_pendiente en OrdenCompraReferenciaResource', function () {
    $ordenCompra = OrdenCompra::factory()->create();

    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => 10,
        'cantidad_recibida' => 6,
        'valor_unitario' => 100,
        'valor_total' => 1000,
    ]);

    $array = (new OrdenCompraReferenciaResource($detalle))->resolve(new Request);

    expect($array['estado_item'])->toBe('Recibida parcialmente')
        ->and($array['saldo_pendiente'])->toBe(4);
});

it('saldo_pendiente nunca es negativo', function () {
    $ordenCompra = OrdenCompra::factory()->create();

    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => 5,
        'cantidad_recibida' => 5,
        'valor_unitario' => 100,
        'valor_total' => 500,
    ]);

    $array = (new OrdenCompraReferenciaResource($detalle))->resolve(new Request);

    expect($array['estado_item'])->toBe('Recibida')
        ->and($array['saldo_pendiente'])->toBe(0);
});
