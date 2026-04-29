<?php

/**
 * Tests de Feature para Artículos
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->user = createUserWithRole('Administrador');
});

it('requiere autenticación para listar artículos', function () {
    $this->getJson('/v1/articulos')->assertStatus(401);
});

it('permite listar artículos', function () {
    \App\Models\Articulo::factory()->count(3)->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/articulos');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'definicion', 'descripcionEspecifica', 'peso', 'created_at'],
            ],
            'meta' => ['current_page', 'total'],
        ]);
});

it('permite ver detalle de artículo', function () {
    $articulo = \App\Models\Articulo::factory()->create([
        'definicion' => 'Acople Dentado',
        'descripcionEspecifica' => 'Descripción de prueba',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/articulos/{$articulo->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.definicion', 'Acople Dentado')
        ->assertJsonPath('data.descripcionEspecifica', 'Descripción de prueba');
});

it('permite crear artículo', function () {
    \Illuminate\Support\Facades\Storage::fake('public');

    $referencias = \App\Models\Referencia::factory()->count(2)->create();
    $foto = \Illuminate\Http\UploadedFile::fake()->image('articulo.jpg');

    $data = [
        'definicion' => 'Nuevo Articulo Test',
        'descripcionEspecifica' => 'Esta es una descripcion de prueba para el test',
        'peso' => 15.5,
        'comentarios' => 'Comentario de prueba',
        'referencias_ids' => $referencias->pluck('id')->toArray(),
        'fotoDescriptiva' => $foto,
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/articulos', $data);

    $response->assertStatus(201);

    expectDatabaseHas('articulos', [
        'definicion' => 'Nuevo Articulo Test',
        'peso' => 15.5,
    ]);

    $articulo = \App\Models\Articulo::where('definicion', 'Nuevo Articulo Test')->first();
    expect($articulo->referencias)->toHaveCount(2);
});

it('permite actualizar artículo', function () {
    $articulo = \App\Models\Articulo::factory()->create([
        'definicion' => 'Articulo Original',
        'peso' => 10.0,
    ]);
    $referencia = \App\Models\Referencia::factory()->create();

    $data = [
        'definicion' => 'Articulo Actualizado',
        'peso' => 20.0,
        'descripcionEspecifica' => 'Nueva descripcion',
        'referencias_ids' => [$referencia->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/articulos/{$articulo->id}", $data);

    $response->assertStatus(200);

    $articulo->refresh();
    expect($articulo->definicion)->toBe('Articulo Actualizado')
        ->and((float) $articulo->peso)->toBe(20.0);
});

it('rechaza crear artículo sin datos requeridos', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/articulos', [
            'definicion' => '',
            'descripcionEspecifica' => '',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['definicion', 'descripcionEspecifica']);
});

it('artículo hereda foto_medida de pieza estándar', function () {
    \Illuminate\Support\Facades\Storage::fake('public');

    $fotoMaestra = 'listas/medidas/maestra.jpg';
    \Illuminate\Support\Facades\Storage::disk('public')->put($fotoMaestra, 'fake content');

    \App\Models\Lista::create([
        'tipo' => 'Piezas Estandar',
        'nombre' => 'Abrazadera Maestra',
        'fotoMedida' => $fotoMaestra,
    ]);

    $referencia = \App\Models\Referencia::factory()->create();
    $data = [
        'definicion' => 'Abrazadera Maestra',
        'descripcionEspecifica' => 'Prueba de herencia',
        'referencias_ids' => [$referencia->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/articulos', $data);

    $response->assertStatus(201);

    $articulo = \App\Models\Articulo::where('descripcionEspecifica', 'Prueba de herencia')->first();
    $expectedUrl = rtrim(config('app.url'), '/').'/storage/'.$fotoMaestra;
    expect($articulo->foto_medida)->toBe($expectedUrl);

    $fotoMaestra2 = 'listas/medidas/maestra2.jpg';
    \Illuminate\Support\Facades\Storage::disk('public')->put($fotoMaestra2, 'fake content');

    \App\Models\Lista::create([
        'tipo' => 'Piezas Estandar',
        'nombre' => 'Abrazadera Maestra 2',
        'fotoMedida' => $fotoMaestra2,
    ]);

    $updateData = [
        'definicion' => 'Abrazadera Maestra 2',
        'referencias_ids' => [$referencia->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/articulos/{$articulo->id}", $updateData);

    $response->assertStatus(200);
    $articulo->refresh();
    $expectedUrl2 = rtrim(config('app.url'), '/').'/storage/'.$fotoMaestra2;
    expect($articulo->foto_medida)->toBe($expectedUrl2);

    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($fotoMaestra);
});
