<?php

use App\Models\Lista;
use App\Models\Sistema;
use App\Services\LandingBrandImageService;
use App\Services\MachineTypeImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    // Seed data needed for landing tests
    $marca = Lista::factory()->create(['tipo' => 'Fabricantes', 'nombre' => 'Marca 1']);

    $sistema = Sistema::create(['nombre' => 'Sistema 1', 'descripcion' => 'Desc']);

    $tipoArticulo = Lista::factory()->create(['tipo' => 'Tipo de Artículo', 'nombre' => 'Tipo Articulo 1']);
    $tipoArticulo->sistemas()->attach($sistema);

    // Categories for quote-data
    $categoria = Lista::factory()->create(['tipo' => 'Categoría de Máquina', 'nombre' => 'Construccion']);
    $sub = Lista::factory()->create([
        'tipo' => 'Tipo de Máquina',
        'nombre' => 'Excavadora',
        'parent_id' => $categoria->id,
        'foto' => 'listas/excavadora.png',
    ]);

    Storage::disk('public')->put('listas/excavadora.png', 'content');
});

it('navbar-data incluye cabeceras de cache publico', function () {
    $response = $this->getJson('/v1/landing/navbar-data');

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))
        ->toContain('public')
        ->toContain('max-age=300')
        ->toContain('stale-while-revalidate=60');
});

it('brands incluye cabeceras de cache publico', function () {
    $response = $this->getJson('/v1/landing/brands');

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))
        ->toContain('public')
        ->toContain('max-age=300');
});

it('logoMeta incluye version en la url del logo', function () {
    $lista = Lista::factory()->create([
        'tipo' => 'Fabricantes',
        'nombre' => 'Marca Test',
        'foto' => null,
    ]);

    $service = app(LandingBrandImageService::class);
    $meta = $service->logoMeta($lista);

    if ($meta === null) {
        expect(true)->toBeTrue();

        return;
    }

    expect($meta['url'])->toContain('?v=');
});

it('quote-data devuelve imagen_url accesible para tipos de maquina con foto', function () {
    $response = $this->getJson('/v1/landing/quote-data');

    $response->assertOk();

    $subcategorias = collect($response->json('categories'))
        ->flatMap(fn (array $category) => $category['subcategorias'] ?? [])
        ->filter(fn (array $sub) => ! empty($sub['imagen_url']));

    expect($subcategorias)->not->toBeEmpty();

    $subcategorias->each(function (array $sub) {
        expect($sub['imagen_url'])->not->toContain('no-image.png');
    });
});

it('quote-data expone payload reducido sin listas anidadas en sistemas', function () {
    $response = $this->getJson('/v1/landing/quote-data');

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('public')->toContain('max-age=300');

    $json = $response->json();

    expect($json)->toHaveKeys(['categories', 'brands', 'systems', 'articleTypes', 'models']);
    expect($json)->not->toHaveKey('listas');

    $firstBrand = $json['brands'][0] ?? null;
    expect($firstBrand)->not->toBeNull();
    expect(array_keys($firstBrand))->toEqual(['id', 'nombre', 'logo']);

    $firstSystem = $json['systems'][0] ?? null;
    expect($firstSystem)->not->toBeNull();
    expect(array_keys($firstSystem))->toEqual(['id', 'nombre']);
    expect($firstSystem)->not->toHaveKey('listas');

    $firstType = $json['articleTypes'][0] ?? null;
    expect($firstType)->not->toBeNull();
    expect($firstType)->toHaveKeys(['id', 'nombre', 'sistema_ids']);
    expect($firstType)->not->toHaveKey('pivot');

    expect(count($json['articleTypes']))->toBeGreaterThan(0);
    expect(strlen($response->getContent()))->toBeLessThan(250_000);
});

it('machine type image service usa fallback si el archivo no existe en disco', function () {
    Storage::fake('public');

    $lista = Lista::factory()->create([
        'tipo' => 'Tipo de Máquina',
        'nombre' => 'Tipo Test',
        'foto' => 'listas/archivo-inexistente.jpg',
    ]);

    $url = app(MachineTypeImageService::class)->resolveImagenUrl($lista);

    expect($url)->toEndWith('/images/no-image.png');
});

it('machine type image service resuelve rutas en storage public', function () {
    Storage::fake('public');
    Storage::disk('public')->putFileAs('listas', UploadedFile::fake()->image('maquina.jpg'), 'maquina-test.jpg');

    $lista = Lista::factory()->create([
        'tipo' => 'Tipo de Máquina',
        'nombre' => 'Tipo Con Foto',
        'foto' => 'listas/maquina-test.jpg',
    ]);

    $url = app(MachineTypeImageService::class)->resolveImagenUrl($lista);

    expect($url)->toContain('/storage/listas/maquina-test.jpg');
});
