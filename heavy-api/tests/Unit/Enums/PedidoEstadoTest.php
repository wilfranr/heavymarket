<?php

/**
 * Tests para el enum PedidoEstado
 *
 * Valida todas las transiciones, labels y métodos estáticos
 */

use App\Enums\PedidoEstado;

// === Transiciones válidas ===

it('define 10 estados', function () {
    expect(PedidoEstado::cases())->toHaveCount(10);
});

it('Borrador puede transitar a Nuevo, En_Analisis o Cancelado', function () {
    $estado = PedidoEstado::Borrador;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::Nuevo)
        ->toContain(PedidoEstado::En_Analisis)
        ->toContain(PedidoEstado::Cancelado)
        ->not->toContain(PedidoEstado::En_Costeo)
        ->not->toContain(PedidoEstado::Cotizado);
});

it('Nuevo puede transitar a En_Analisis, En_Costeo o Cancelado', function () {
    $estado = PedidoEstado::Nuevo;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::En_Analisis)
        ->toContain(PedidoEstado::En_Costeo)
        ->toContain(PedidoEstado::Cancelado)
        ->not->toContain(PedidoEstado::Borrador);
});

it('En_Analisis puede transitar a En_Costeo, Cotizado, Nuevo o Cancelado', function () {
    $estado = PedidoEstado::En_Analisis;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::En_Costeo)
        ->toContain(PedidoEstado::Cotizado)
        ->toContain(PedidoEstado::Nuevo)
        ->toContain(PedidoEstado::Cancelado);
});

it('En_Costeo puede transitar a Cotizado, En_Analisis o Cancelado', function () {
    $estado = PedidoEstado::En_Costeo;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::Cotizado)
        ->toContain(PedidoEstado::En_Analisis)
        ->toContain(PedidoEstado::Cancelado);
});

it('Cotizado puede transitar a Aprobado, Rechazado o Cancelado', function () {
    $estado = PedidoEstado::Cotizado;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::Aprobado)
        ->toContain(PedidoEstado::Rechazado)
        ->toContain(PedidoEstado::Cancelado);
});

it('Aprobado puede transitar a Enviado o Cancelado', function () {
    $estado = PedidoEstado::Aprobado;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::Enviado)
        ->toContain(PedidoEstado::Cancelado);
});

it('Enviado puede transitar a Entregado o Cancelado', function () {
    $estado = PedidoEstado::Enviado;
    $validas = $estado->transicionesValidas();

    expect($validas)->toContain(PedidoEstado::Entregado)
        ->toContain(PedidoEstado::Cancelado);
});

it('estados finales no tienen transiciones', function () {
    $finales = [PedidoEstado::Entregado, PedidoEstado::Rechazado, PedidoEstado::Cancelado];

    foreach ($finales as $estado) {
        expect($estado->transicionesValidas())->toBeEmpty(
            "El estado {$estado->value} debería ser final"
        );
    }
});

// === puedeTransitarA ===

it('puedeTransitarA retorna true para transición válida', function () {
    expect(PedidoEstado::Nuevo->puedeTransitarA(PedidoEstado::En_Analisis))->toBeTrue()
        ->and(PedidoEstado::Borrador->puedeTransitarA(PedidoEstado::Cancelado))->toBeTrue();
});

it('puedeTransitarA retorna false para transición inválida', function () {
    expect(PedidoEstado::Borrador->puedeTransitarA(PedidoEstado::Cotizado))->toBeFalse()
        ->and(PedidoEstado::Nuevo->puedeTransitarA(PedidoEstado::Aprobado))->toBeFalse()
        ->and(PedidoEstado::Entregado->puedeTransitarA(PedidoEstado::Nuevo))->toBeFalse();
});

// === Labels ===

it('retorna labels correctos para cada estado', function () {
    expect(PedidoEstado::Borrador->label())->toBe('Borrador')
        ->and(PedidoEstado::En_Analisis->label())->toBe('En Análisis')
        ->and(PedidoEstado::En_Costeo->label())->toBe('En Costeo')
        ->and(PedidoEstado::Cancelado->label())->toBe('Cancelado');
});

// === Métodos estáticos ===

it('todos retorna los 10 estados', function () {
    expect(PedidoEstado::todos())->toHaveCount(10);
});

it('toArray retorna array de strings', function () {
    $array = PedidoEstado::toArray();

    expect($array)->toBeArray()
        ->toHaveCount(10)
        ->toContain('Borrador', 'Nuevo', 'En_Analisis', 'Cancelado');

    foreach ($array as $valor) {
        expect($valor)->toBeString();
    }
});

it('estadosIniciales retorna Borrador, Nuevo y En_Analisis', function () {
    $iniciales = PedidoEstado::estadosIniciales();

    expect($iniciales)->toContain(PedidoEstado::Borrador)
        ->toContain(PedidoEstado::Nuevo)
        ->toContain(PedidoEstado::En_Analisis)
        ->not->toContain(PedidoEstado::Cotizado);
});

it('estadosQueRequierenMaquinaRevisada retorna solo En_Analisis', function () {
    $requieren = PedidoEstado::estadosQueRequierenMaquinaRevisada();

    expect($requieren)->toHaveCount(1)
        ->toContain(PedidoEstado::En_Analisis);
});
