<?php

declare(strict_types=1);

use App\Models\Lista;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->user = createUserWithRole('Administrador');
});

it('index de listas responde payload liviano sin fabricante', function () {
    Lista::factory()->count(3)->create(['tipo' => 'Marca']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/listas?per_page=10&page=1');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'tipo', 'nombre', 'definicion', 'foto', 'fotoMedida'],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);

    $first = $response->json('data.0');
    expect($first)->not->toHaveKey('fabricante')
        ->and($first)->not->toHaveKey('sistemas')
        ->and($first)->not->toHaveKey('sistema_ids');
});

it('index no devuelve url para foto legacy sin ruta en storage', function () {
    $lista = Lista::factory()->create([
        'tipo' => 'Marca',
        'nombre' => 'Legacy Sin Ruta',
        'foto' => 'AC_LegacyOnly.png',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/listas?search=Legacy Sin Ruta');

    $response->assertOk();
    $item = collect($response->json('data'))->firstWhere('id', $lista->id);
    expect($item)->not->toBeNull()
        ->and($item['foto'])->toBeNull();
});

it('index resuelve foto con url publica sin accessor de disco', function () {
    Storage::fake('public');
    $path = 'listas/test-logo.png';
    Storage::disk('public')->put($path, 'fake');

    $lista = Lista::factory()->create([
        'tipo' => 'Marca',
        'foto' => $path,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/listas?search='.$lista->nombre);

    $response->assertOk();
    $item = collect($response->json('data'))->firstWhere('id', $lista->id);
    expect($item)->not->toBeNull()
        ->and($item['foto'])->toBe('/storage/'.$path);
});
