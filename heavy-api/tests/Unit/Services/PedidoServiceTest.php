<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\PedidoService;
use App\Models\PedidoReferencia;
use App\Models\Referencia;
use App\Models\Empresa;
use Mockery;

class PedidoServiceTest extends TestCase
{
    protected $pedidoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pedidoService = new PedidoService();
    }

    /** @test */
    public function test_calcular_valores_nacionales_exitoso()
    {
        $datos = [
            'costo_unidad' => 1000,
            'utilidad' => 20,
            'cantidad' => 2,
            'ubicacion' => 'Nacional'
        ];
        
        $pedidoReferencia = Mockery::mock(PedidoReferencia::class);
        $resultado = $this->pedidoService->calcularValores($datos, $pedidoReferencia);

        // 1000 + 20% = 1200. Total 2400.
        $this->assertEquals(1200, $resultado['valor_unidad']);
        $this->assertEquals(2400, $resultado['valor_total']);
    }

    /** @test */
    public function test_calcular_valores_internacionales_peso_cero_y_trm_cero()
    {
        $datos = [
            'costo_unidad' => 100,
            'utilidad' => 10,
            'cantidad' => 1,
            'ubicacion' => 'Internacional'
        ];

        // Usamos Mockery para interceptar la llamada estática a Empresa
        // En Laravel, esto se hace mejor mockeando el modelo antes de la llamada
        $empresaMock = Mockery::mock('alias:App\Models\Empresa');
        $empresaMock->shouldReceive('where->first')->andReturn((object)[
            'trm' => 0, // Caso de borde: TRM cero
            'flete' => 10
        ]);

        $referenciaObj = new \stdClass();
        $referenciaObj->peso = 0; // Caso de borde: peso cero

        // Usamos un objeto simple que el servicio pueda consumir
        $pedidoReferencia = Mockery::mock(PedidoReferencia::class);
        $pedidoReferencia->shouldReceive('getAttribute')->with('referencia')->andReturn($referenciaObj);

        $resultado = $this->pedidoService->calcularValores($datos, $pedidoReferencia);

        // TRM 0 -> Fallback 1. Peso 0 -> Flete 0.
        // Costo 100 + 10% = 110. Redondeado -2 = 100.
        $this->assertEquals(100, $resultado['valor_unidad']);
        $this->assertEquals(100, $resultado['valor_total']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
