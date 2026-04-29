<?php

/**
 * Tests para el trait NormalizesResources
 * 
 * Valida la normalización de atributos en modelos
 */

use App\Models\Maquina;
use App\Models\Lista;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// === Normalización title ===

it('normaliza a title case con regla title', function () {
    $maquina = Maquina::factory()->create([
        'modelo' => 'cat 320 excavadora',
    ]);

    expect($maquina->modelo)->toBe('Cat 320 Excavadora');
});

it('normaliza nombre con title case', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'caterpillar inc.',
    ]);

    expect($lista->nombre)->toBe('Caterpillar Inc.');
});

// === Normalización upper/code/serial ===

it('aplica title case a definicion en Lista', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'caterpillar',
        'definicion' => 'COD-123-abc',
    ]);

    // definicion tiene regla 'title' en Lista
    expect($lista->definicion)->toBe('Cod-123-Abc');
});

// === Normalización sentence/description ===

it('aplica sentence case con regla sentence', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'mi marca especial',
    ]);

    expect($lista->nombre)->toBe('Mi Marca Especial');
});

// === Edge cases ===

it('no normaliza atributos null', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'Test Brand',
        'definicion' => null,
    ]);

    expect($lista->definicion)->toBeNull();
});

it('normaliza al actualizar', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'Original Name',
    ]);

    $lista->update(['nombre' => 'updated name here']);

    expect($lista->fresh()->nombre)->toBe('Updated Name Here');
});

it('trim aplica antes de normalizar', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => '  spaced name  ',
    ]);

    expect($lista->nombre)->toBe('Spaced Name');
});

it('soporta caracteres multibyte', function () {
    $lista = Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'mañana y café',
    ]);

    expect($lista->nombre)->toBe('Mañana Y Café');
});
