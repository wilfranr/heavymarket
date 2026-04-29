<?php

/**
 * Tests unitarios para PedidoService
 */

use App\Services\PedidoService;
use Mockery;

beforeEach(function () {
    $this->pedidoService = new PedidoService;
});

afterEach(function () {
    Mockery::close();
});

it('calcula valores nacionales exitoso', function () {
    $datos = [
        'costo_unidad' => 1000,
        'utilidad' => 20,
        'cantidad' => 2,
        'ubicacion' => 'Nacional',
    ];

    $pedidoReferencia = Mockery::mock(\App\Models\PedidoReferencia::class);
    $resultado = $this->pedidoService->calcularValores($datos, $pedidoReferencia);

    // 1000 + 20% = 1200. Total 2400.
    expect((float) $resultado['valor_unidad'])->toBe(1200.0)
        ->and((float) $resultado['valor_total'])->toBe(2400.0);
});

it('calcula valores internacionales con peso cero y TRM cero', function () {
    $datos = [
        'costo_unidad' => 100,
        'utilidad' => 10,
        'cantidad' => 1,
        'ubicacion' => 'Internacional',
    ];

    $empresaMock = Mockery::mock('alias:App\Models\Empresa');
    $empresaMock->shouldReceive('where->first')->andReturn((object) [
        'trm' => 0,
        'flete' => 10,
    ]);

    $referenciaObj = new \stdClass;
    $referenciaObj->peso = 0;

    $pedidoReferencia = Mockery::mock(\App\Models\PedidoReferencia::class);
    $pedidoReferencia->shouldReceive('getAttribute')->with('referencia')->andReturn($referenciaObj);

    $resultado = $this->pedidoService->calcularValores($datos, $pedidoReferencia);

    // TRM 0 -> Fallback 1. Peso 0 -> Flete 0.
    // Costo 100 + 10% = 110. Redondeado -2 = 100.
    expect((float) $resultado['valor_unidad'])->toBe(100.0)
        ->and((float) $resultado['valor_total'])->toBe(100.0);
});
