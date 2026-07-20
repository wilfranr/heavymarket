<?php

use App\Enums\OrdenCompraEstado;

it('define los 7 estados del ciclo de vida de orden de compra', function () {
    expect(OrdenCompraEstado::cases())->toHaveCount(7)
        ->and(OrdenCompraEstado::toArray())->toContain(
            'Pendiente de envío',
            'Enviada',
            'Confirmada',
            'Recibida parcialmente',
            'Recibida',
            'Cerrada',
            'Cancelada'
        );
});

it('permite transiciones válidas del flujo principal', function () {
    expect(OrdenCompraEstado::PendienteDeEnvio->puedeTransitarA(OrdenCompraEstado::Enviada))->toBeTrue()
        ->and(OrdenCompraEstado::Enviada->puedeTransitarA(OrdenCompraEstado::Confirmada))->toBeTrue()
        ->and(OrdenCompraEstado::Confirmada->puedeTransitarA(OrdenCompraEstado::RecibidaParcialmente))->toBeTrue()
        ->and(OrdenCompraEstado::Confirmada->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeTrue()
        ->and(OrdenCompraEstado::RecibidaParcialmente->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeTrue()
        ->and(OrdenCompraEstado::Recibida->puedeTransitarA(OrdenCompraEstado::Cerrada))->toBeTrue();
});

it('rechaza transiciones inválidas y terminales', function () {
    expect(OrdenCompraEstado::PendienteDeEnvio->puedeTransitarA(OrdenCompraEstado::Recibida))->toBeFalse()
        ->and(OrdenCompraEstado::RecibidaParcialmente->puedeTransitarA(OrdenCompraEstado::Cancelada))->toBeFalse()
        ->and(OrdenCompraEstado::Cerrada->transicionesValidas())->toBeEmpty()
        ->and(OrdenCompraEstado::Cancelada->transicionesValidas())->toBeEmpty();
});

it('identifica estados terminales', function () {
    expect(OrdenCompraEstado::Cerrada->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Cancelada->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Recibida->esTerminal())->toBeFalse();
});
