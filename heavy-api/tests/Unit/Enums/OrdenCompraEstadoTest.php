<?php

use App\Enums\OrdenCompraEstado;

it('define los 8 estados del ciclo de vida de orden de compra', function () {
    expect(OrdenCompraEstado::cases())->toHaveCount(8)
        ->and(OrdenCompraEstado::toArray())->toContain(
            'Generada',
            'Enviada',
            'Confirmada',
            'Pagada',
            'Despachada',
            'Recibida parcialmente',
            'Recibida',
            'Cancelada'
        );
});

it('permite transiciones válidas del flujo principal', function () {
    expect(OrdenCompraEstado::Generada->puedeTransitarA(OrdenCompraEstado::Enviada))->toBeTrue()
        ->and(OrdenCompraEstado::Enviada->puedeTransitarA(OrdenCompraEstado::Confirmada))->toBeTrue()
        ->and(OrdenCompraEstado::Confirmada->puedeTransitarA(OrdenCompraEstado::Pagada))->toBeTrue()
        ->and(OrdenCompraEstado::Pagada->puedeTransitarA(OrdenCompraEstado::Despachada))->toBeTrue()
        ->and(OrdenCompraEstado::Despachada->puedeTransitarA(OrdenCompraEstado::RecibidaParcialmente))->toBeTrue()
        ->and(OrdenCompraEstado::Despachada->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeTrue()
        ->and(OrdenCompraEstado::RecibidaParcialmente->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeTrue();
});

it('rechaza transiciones inválidas y terminales', function () {
    expect(OrdenCompraEstado::Generada->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeFalse()
        ->and(OrdenCompraEstado::RecibidaParcialmente->puedeTransitarA(OrdenCompraEstado::Cancelada))->toBeFalse()
        ->and(OrdenCompraEstado::Recibida->transicionesValidas())->toBeEmpty()
        ->and(OrdenCompraEstado::Cancelada->transicionesValidas())->toBeEmpty();
});

it('identifica estados terminales', function () {
    expect(OrdenCompraEstado::Recibida->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Cancelada->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Despachada->esTerminal())->toBeFalse();
});
