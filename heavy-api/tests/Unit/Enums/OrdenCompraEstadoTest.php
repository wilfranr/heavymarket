<?php

use App\Enums\OrdenCompraEstado;

it('define los 18 estados (10 nuevos del cliente y 8 de retrocompatibilidad) del ciclo de vida de orden de compra', function () {
    expect(OrdenCompraEstado::cases())->toHaveCount(18)
        ->and(OrdenCompraEstado::toArray())->toContain(
            'Pendiente de Revisión de Stock',
            'Stock Incompleto',
            'En Espera de Aprobación Gerencial',
            'Devuelta por Gerencia',
            'Pendiente de Pago',
            'Pagada / Lista para Despacho',
            'Cancelada - Reembolso Pendiente',
            'En Tránsito',
            'Recepción con Novedades (Bloqueada)',
            'Entregada / Cerrada',
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

it('permite transiciones válidas del nuevo flujo formal del cliente', function () {
    expect(OrdenCompraEstado::PendienteRevisionStock->puedeTransitarA(OrdenCompraEstado::StockIncompleto))->toBeTrue()
        ->and(OrdenCompraEstado::PendienteRevisionStock->puedeTransitarA(OrdenCompraEstado::EnEsperaAprobacionGerencial))->toBeTrue()
        ->and(OrdenCompraEstado::StockIncompleto->puedeTransitarA(OrdenCompraEstado::EnEsperaAprobacionGerencial))->toBeTrue()
        ->and(OrdenCompraEstado::EnEsperaAprobacionGerencial->puedeTransitarA(OrdenCompraEstado::PendienteDePago))->toBeTrue()
        ->and(OrdenCompraEstado::EnEsperaAprobacionGerencial->puedeTransitarA(OrdenCompraEstado::DevueltaPorGerencia))->toBeTrue()
        ->and(OrdenCompraEstado::DevueltaPorGerencia->puedeTransitarA(OrdenCompraEstado::EnEsperaAprobacionGerencial))->toBeTrue()
        ->and(OrdenCompraEstado::PendienteDePago->puedeTransitarA(OrdenCompraEstado::PagadaListaDespacho))->toBeTrue()
        ->and(OrdenCompraEstado::PagadaListaDespacho->puedeTransitarA(OrdenCompraEstado::EnTransito))->toBeTrue()
        ->and(OrdenCompraEstado::PagadaListaDespacho->puedeTransitarA(OrdenCompraEstado::CanceladaReembolsoPendiente))->toBeTrue()
        ->and(OrdenCompraEstado::EnTransito->puedeTransitarA(OrdenCompraEstado::EntregadaCerrada))->toBeTrue()
        ->and(OrdenCompraEstado::EnTransito->puedeTransitarA(OrdenCompraEstado::RecepcionConNovedades))->toBeTrue()
        ->and(OrdenCompraEstado::RecepcionConNovedades->puedeTransitarA(OrdenCompraEstado::PagadaListaDespacho))->toBeTrue()
        ->and(OrdenCompraEstado::RecepcionConNovedades->puedeTransitarA(OrdenCompraEstado::EntregadaCerrada))->toBeTrue();
});

it('permite transiciones válidas del flujo retrocompatible', function () {
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
        ->and(OrdenCompraEstado::EntregadaCerrada->transicionesValidas())->toBeEmpty()
        ->and(OrdenCompraEstado::Cancelada->transicionesValidas())->toBeEmpty()
        ->and(OrdenCompraEstado::CanceladaReembolsoPendiente->transicionesValidas())->toBeEmpty();
});

it('identifica estados terminales', function () {
    expect(OrdenCompraEstado::Recibida->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::EntregadaCerrada->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Cancelada->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::CanceladaReembolsoPendiente->esTerminal())->toBeTrue()
        ->and(OrdenCompraEstado::Despachada->esTerminal())->toBeFalse()
        ->and(OrdenCompraEstado::EnTransito->esTerminal())->toBeFalse();
});
