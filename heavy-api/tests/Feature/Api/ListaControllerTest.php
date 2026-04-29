<?php

/**
 * Tests de Feature para Listas
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->user = createUserWithRole('Administrador');
});

it('permite crear pieza estándar con foto medida', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $fotoMedida = \Illuminate\Http\UploadedFile::fake()->image('plano.jpg');

    $data = [
        'tipo' => 'Piezas Estandar',
        'nombre' => 'Abrazadera Test',
        'definicion' => 'Definición de prueba',
        'fotoMedida' => $fotoMedida,
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/listas', $data);

    $response->assertStatus(201);
    expectDatabaseHas('listas', [
        'nombre' => 'Abrazadera Test',
        'tipo' => 'Piezas Estandar',
    ]);

    $lista = \App\Models\Lista::where('nombre', 'Abrazadera Test')->first();
    expect($lista->fotoMedida)->not->toBeNull();

    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($lista->fotoMedida);
});

it('permite actualizar lista', function () {
    $lista = \App\Models\Lista::create([
        'tipo' => 'Marca',
        'nombre' => 'Marca Original',
        'definicion' => 'Original',
    ]);

    $data = [
        'nombre' => 'Marca Actualizada',
        'definicion' => 'Actualizada',
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/listas/{$lista->id}", $data);

    $response->assertStatus(200);
    expectDatabaseHas('listas', [
        'id' => $lista->id,
        'nombre' => 'Marca Actualizada',
    ]);
});
