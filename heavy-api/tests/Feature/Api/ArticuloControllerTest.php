<?php

use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Referencia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para Artículos
 */
beforeEach(function () {
    Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->user = createUserWithRole('Administrador');
});

it('requiere autenticación para listar artículos', function () {
    $this->getJson('/v1/articulos')->assertStatus(401);
});

it('permite listar artículos', function () {
    Articulo::factory()->count(3)->create();

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

it('permite buscar artículos por referencias de cruce', function () {
    $articuloPivot = Articulo::factory()->create([
        'definicion' => 'Filtro Pivot',
        'descripcionEspecifica' => 'Artículo con referencia pivot',
    ]);
    $articuloDirecto = Articulo::factory()->create([
        'definicion' => 'Filtro Directo',
        'descripcionEspecifica' => 'Artículo con referencia directa',
    ]);
    Articulo::factory()->create([
        'definicion' => 'No coincide',
        'descripcionEspecifica' => 'Artículo fuera del filtro',
    ]);

    $referenciaPivot = Referencia::factory()->create(['referencia' => 'CRUCE-PIVOT-001']);
    Referencia::factory()->create([
        'referencia' => 'CRUCE-DIRECTA-002',
        'articulo_id' => $articuloDirecto->id,
    ]);
    $articuloPivot->referencias()->attach($referenciaPivot->id);

    $responsePivot = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/articulos?search=CRUCE-PIVOT-001');

    $responsePivot->assertStatus(200)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $articuloPivot->id);

    $responseDirecta = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/articulos?search=CRUCE-DIRECTA-002');

    $responseDirecta->assertStatus(200)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $articuloDirecto->id);
});

it('permite ver detalle de artículo', function () {
    $articulo = Articulo::factory()->create([
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
    Storage::fake('public');

    $referencias = Referencia::factory()->count(2)->create();
    $foto = UploadedFile::fake()->image('articulo.jpg');

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

    $articulo = Articulo::where('definicion', 'Nuevo Articulo Test')->first();
    expect($articulo->referencias)->toHaveCount(2);
});

it('permite actualizar artículo', function () {
    $articulo = Articulo::factory()->create([
        'definicion' => 'Articulo Original',
        'peso' => 10.0,
    ]);
    $referencia = Referencia::factory()->create();

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
    Storage::fake('public');

    $fotoMaestra = 'listas/medidas/maestra.jpg';
    Storage::disk('public')->put($fotoMaestra, 'fake content');

    Lista::create([
        'tipo' => 'Piezas Estandar',
        'nombre' => 'Abrazadera Maestra',
        'fotoMedida' => $fotoMaestra,
    ]);

    $referencia = Referencia::factory()->create();
    $data = [
        'definicion' => 'Abrazadera Maestra',
        'descripcionEspecifica' => 'Prueba de herencia',
        'referencias_ids' => [$referencia->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/articulos', $data);

    $response->assertStatus(201);

    $articulo = Articulo::where('descripcionEspecifica', 'Prueba de herencia')->first();
    $expectedUrl = rtrim(config('app.url'), '/').'/storage/'.$fotoMaestra;
    expect($articulo->foto_medida)->toBe($expectedUrl);

    $fotoMaestra2 = 'listas/medidas/maestra2.jpg';
    Storage::disk('public')->put($fotoMaestra2, 'fake content');

    Lista::create([
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

    Storage::disk('public')->assertExists($fotoMaestra);
});

it('sincroniza articulo_id en referencias al crear y actualizar articulo', function () {
    $referencia1 = Referencia::factory()->create();
    $referencia2 = Referencia::factory()->create();

    // 1. Validar en store
    $data = [
        'definicion' => 'Articulo Sincronizacion',
        'descripcionEspecifica' => 'Prueba de sincronización',
        'referencias_ids' => [$referencia1->id, $referencia2->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/articulos', $data);

    $response->assertStatus(201);

    $articulo = Articulo::where('definicion', 'Articulo Sincronizacion')->first();

    $referencia1->refresh();
    $referencia2->refresh();

    expect($referencia1->articulo_id)->toBe($articulo->id)
        ->and($referencia2->articulo_id)->toBe($articulo->id);

    // 2. Validar en update (cambiar referencias: desasociar 1 y agregar una nueva)
    $referencia3 = Referencia::factory()->create();

    $updateData = [
        'definicion' => 'Articulo Sincronizacion Modificado',
        'referencias_ids' => [$referencia2->id, $referencia3->id],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/articulos/{$articulo->id}", $updateData);

    $response->assertStatus(200);

    $referencia1->refresh();
    $referencia2->refresh();
    $referencia3->refresh();

    // Referencia 1 debe estar desasociada
    expect($referencia1->articulo_id)->toBeNull();
    // Referencia 2 y 3 deben pertenecer a este artículo
    expect($referencia2->articulo_id)->toBe($articulo->id)
        ->and($referencia3->articulo_id)->toBe($articulo->id);
});

it('sincroniza articulo_id en referencias al agregar y remover referencia individualmente', function () {
    $articulo = Articulo::factory()->create();
    $referencia = Referencia::factory()->create();

    // 1. Agregar referencia
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson("/v1/articulos/{$articulo->id}/referencias", [
            'referencia_id' => $referencia->id,
        ]);

    $response->assertStatus(200);

    $referencia->refresh();
    expect($referencia->articulo_id)->toBe($articulo->id);

    // 2. Remover referencia
    $response = $this->actingAs($this->user, 'sanctum')
        ->deleteJson("/v1/articulos/{$articulo->id}/referencias/{$referencia->id}");

    $response->assertStatus(200);

    $referencia->refresh();
    expect($referencia->articulo_id)->toBeNull();
});
