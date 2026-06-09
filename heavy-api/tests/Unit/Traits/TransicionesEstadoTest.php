<?php

/**
 * Tests para el trait TransicionesEstado
 *
 * Valida la lógica de transiciones en modelos que usan el trait
 */

use App\Enums\PedidoEstado;
use App\Models\Pedido;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    seedPermissions();
});

it('obtiene estado enum desde string', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($pedido->getEstadoEnum())->toBe(PedidoEstado::Nuevo);
});

it('obtiene estado string', function () {
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

    expect($pedido->getEstado())->toBe('En_Analisis');
});

it('obtiene label del estado', function () {
    $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);

    expect($pedido->getEstadoLabel())->toBe('En Costeo');
});

it('puede transitar a estado válido', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($pedido->puedeTransitarA(PedidoEstado::En_Analisis))->toBeTrue()
        ->and($pedido->puedeTransitarA(PedidoEstado::Cancelado))->toBeTrue();
});

it('no puede transitar a estado inválido', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Borrador']);

    expect($pedido->puedeTransitarA(PedidoEstado::Aprobado))->toBeFalse()
        ->and($pedido->puedeTransitarA(PedidoEstado::Entregado))->toBeFalse();
});

it('transita exitosamente a estado válido', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    $resultado = $pedido->transitarA(PedidoEstado::En_Analisis);

    expect($resultado)->toBeTrue()
        ->and($pedido->getEstado())->toBe('En_Analisis');
});

it('lanza excepción en transición inválida', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Borrador']);

    $pedido->transitarA(PedidoEstado::Aprobado);
})->throws(InvalidArgumentException::class, 'Transición inválida');

it('getTransicionesValidas retorna transiciones correctas', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Cotizado']);

    $transiciones = $pedido->getTransicionesValidas();

    expect($transiciones)->toContain(PedidoEstado::Aprobado)
        ->toContain(PedidoEstado::Rechazado)
        ->toContain(PedidoEstado::Cancelado)
        ->toHaveCount(3);
});

it('getEstadosPermitidos retorna array de strings', function () {
    $estados = Pedido::getEstadosPermitidos();

    expect($estados)->toBeArray()
        ->toHaveCount(10)
        ->toContain('Borrador', 'Nuevo', 'En_Analisis');
});

it('transición múltiple en cadena funciona', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Borrador']);

    $pedido->transitarA(PedidoEstado::Nuevo);
    expect($pedido->getEstado())->toBe('Nuevo');

    $pedido->transitarA(PedidoEstado::En_Analisis);
    expect($pedido->getEstado())->toBe('En_Analisis');

    $pedido->transitarA(PedidoEstado::En_Costeo);
    expect($pedido->getEstado())->toBe('En_Costeo');

    $pedido->transitarA(PedidoEstado::Cotizado);
    expect($pedido->getEstado())->toBe('Cotizado');
});

it('estados finales no permiten transiciones', function () {
    $pedido = Pedido::factory()->create(['estado' => 'Entregado']);

    expect($pedido->puedeTransitarA(PedidoEstado::Cancelado))->toBeFalse();

    $pedido->transitarA(PedidoEstado::Cancelado);
})->throws(InvalidArgumentException::class);
