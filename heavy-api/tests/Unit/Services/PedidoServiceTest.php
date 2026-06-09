<?php

/**
 * Tests unitarios para PedidoService
 */

use App\Models\Country;
use App\Models\Empresa;
use App\Models\PedidoReferencia;
use App\Models\Tercero;
use App\Services\PedidoService;

beforeEach(function () {
    $this->pedidoService = new PedidoService;
});

it('calcula valores nacionales exitoso', function () {
    $datos = [
        'costo_unidad' => 1000,
        'utilidad' => 20,
        'cantidad' => 2,
        'ubicacion' => 'Nacional',
    ];

    $pedidoReferencia = new PedidoReferencia;
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
        'proveedor_id' => null,
    ];

    Empresa::create([
        'nombre' => 'Test',
        'trm' => 0,
        'flete' => 10,
    ]);

    $referenciaObj = new class
    {
        public object $articulo;

        public function loadMissing(string|array $relations): void {}
    };
    $referenciaObj->articulo = (object) ['peso' => 0];

    $pedidoReferencia = Mockery::mock(PedidoReferencia::class)->makePartial();
    $pedidoReferencia->shouldReceive('getAttribute')->with('referencia')->andReturn($referenciaObj);

    $resultado = $this->pedidoService->calcularValores($datos, $pedidoReferencia);

    expect((float) $resultado['valor_unidad'])->toBe(100.0)
        ->and((float) $resultado['valor_total'])->toBe(100.0)
        ->and($resultado['missing_freight_rate'])->toBeFalse();
});

it('usa flete del país del proveedor internacional', function () {
    $usa = Country::factory()->create(['iso2' => 'US', 'flete' => 4.0]);
    $proveedor = Tercero::factory()->create(['country_id' => $usa->id]);

    Empresa::create(['nombre' => 'Test', 'trm' => 4000, 'flete' => 99, 'estado' => 1]);

    $referenciaObj = new class
    {
        public object $articulo;

        public function loadMissing(string|array $relations): void {}
    };
    $referenciaObj->articulo = (object) ['peso' => 453.592];
    $pedidoReferencia = Mockery::mock(PedidoReferencia::class)->makePartial();
    $pedidoReferencia->shouldReceive('getAttribute')->with('referencia')->andReturn($referenciaObj);

    $resultado = $this->pedidoService->calcularValores([
        'costo_unidad' => 0,
        'utilidad' => 0,
        'cantidad' => 1,
        'ubicacion' => 'Internacional',
        'proveedor_id' => $proveedor->id,
    ], $pedidoReferencia);

    expect((float) $resultado['flete_usado'])->toBe(4.0)
        ->and($resultado['missing_freight_rate'])->toBeFalse();
});
