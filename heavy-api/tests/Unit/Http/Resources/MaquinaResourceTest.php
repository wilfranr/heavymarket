<?php

/**
 * Tests para MaquinaResource
 */

use App\Http\Resources\MaquinaResource;
use App\Models\Lista;
use App\Models\Maquina;
use Illuminate\Http\Request;

it('incluye todos los campos requeridos', function () {
    $tipo = Lista::factory()->tipoMaquina()->create();
    $fabricante = Lista::factory()->fabricante()->create();

    $maquina = Maquina::factory()->create([
        'tipo' => $tipo->id,
        'fabricante_id' => $fabricante->id,
        'codigo_interno' => 'HM-RES-001',
    ]);

    $maquina->load(['fabricante', 'listas']);

    $resource = new MaquinaResource($maquina);
    $array = $resource->resolve(new Request);

    expect($array)->toHaveKeys([
        'id', 'tipo', 'modelo', 'fabricante_id', 'marca', 'codigo_interno', 'serie',
        'arreglo', 'estado_revision', 'created_at', 'updated_at',
    ])->and($array['marca'])->toBe($fabricante->nombre)
        ->and($array['codigo_interno'])->toBe('HM-RES-001');
});

it('incluye estado_revision con valor correcto', function () {
    $tipo = Lista::factory()->tipoMaquina()->create();
    $fabricante = Lista::factory()->fabricante()->create();

    $maquina = Maquina::factory()->revisada()->create([
        'tipo' => $tipo->id,
        'fabricante_id' => $fabricante->id,
    ]);

    $resource = new MaquinaResource($maquina);
    $array = $resource->resolve(new Request);

    expect($array['estado_revision'])->toBe('revisado');
});

it('incluye relaciones cuando están cargadas', function () {
    $tipo = Lista::factory()->tipoMaquina()->create();
    $fabricante = Lista::factory()->fabricante()->create();

    $maquina = Maquina::factory()->create([
        'tipo' => $tipo->id,
        'fabricante_id' => $fabricante->id,
    ]);

    $maquina->load(['fabricante', 'listas']);

    $resource = new MaquinaResource($maquina);
    $array = $resource->resolve(new Request);

    expect($array)->toHaveKeys(['fabricante', 'tipoLista']);
});

it('no incluye relaciones si no están cargadas', function () {
    $tipo = Lista::factory()->tipoMaquina()->create();
    $fabricante = Lista::factory()->fabricante()->create();

    $maquina = Maquina::factory()->create([
        'tipo' => $tipo->id,
        'fabricante_id' => $fabricante->id,
    ]);

    $resource = new MaquinaResource($maquina);
    $array = $resource->resolve(new Request);

    expect($array)->not->toHaveKeys(['fabricante', 'tipoLista'])
        ->and($array)->toHaveKey('marca')
        ->and($array['marca'])->toBeNull();
});
