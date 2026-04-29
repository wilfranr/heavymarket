<?php

/**
 * Tests para ListaResource - expone fabricante cuando relación está cargada
 */

use App\Http\Resources\ListaResource;
use App\Models\Fabricante;
use App\Models\Lista;
use Illuminate\Http\Request;

beforeEach(function () {
    // No database needed - using model instances directly
});

it('incluye fabricante cuando la relación está cargada', function () {
    $fabricante = new Fabricante;
    $fabricante->forceFill([
        'id' => 42,
        'nombre' => 'Marca desde fabricantes',
        'descripcion' => 'Texto de apoyo',
        'logo' => null,
    ]);
    $fabricante->syncOriginal();

    $lista = Lista::make([
        'tipo' => 'Fabricantes',
        'nombre' => 'Marca desde fabricantes',
        'definicion' => 'Texto de apoyo',
        'foto' => null,
        'fotoMedida' => null,
        'sistema_id' => null,
        'parent_id' => null,
        'fabricante_id' => 42,
    ]);
    $lista->id = 1001;
    $lista->syncOriginal();
    $lista->setRelation('fabricante', $fabricante);

    $request = Request::create('/v1/listas', 'GET');
    $array = (new ListaResource($lista))->resolve($request);

    expect($array)->toHaveKey('fabricante')
        ->and($array['fabricante'])->toBeArray()
        ->and($array['fabricante']['id'])->toBe(42)
        ->and($array['fabricante']['nombre'])->toBe('Marca desde fabricantes')
        ->and($array['fabricante_id'])->toBe(42);
});

it('no incluye fabricante si la relación no está cargada', function () {
    $lista = Lista::make([
        'tipo' => 'Marca',
        'nombre' => 'Solo marca',
        'definicion' => null,
        'foto' => null,
        'fotoMedida' => null,
        'sistema_id' => null,
        'parent_id' => null,
        'fabricante_id' => null,
    ]);
    $lista->id = 2002;
    $lista->syncOriginal();

    $lista->unsetRelation('fabricante');

    $request = Request::create('/v1/listas', 'GET');
    $array = (new ListaResource($lista))->resolve($request);

    expect($array)->not->toHaveKey('fabricante');
});
