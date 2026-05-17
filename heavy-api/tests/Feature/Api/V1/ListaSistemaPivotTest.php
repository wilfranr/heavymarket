<?php

declare(strict_types=1);

use App\Models\Lista;
use App\Models\Sistema;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->user = createUserWithRole('Administrador');
});

it('sincroniza pivot al crear lista tipo articulo con sistema_ids', function () {
    $sistemaA = Sistema::factory()->create(['nombre' => 'Hidraulico Test']);
    $sistemaB = Sistema::factory()->create(['nombre' => 'Motor Test']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/listas', [
            'tipo' => 'Tipo de Artículo',
            'nombre' => 'Bomba Pivot',
            'sistema_ids' => [$sistemaA->id, $sistemaB->id],
        ]);

    $response->assertStatus(201);

    $lista = Lista::where('nombre', 'Bomba Pivot')->first();
    expect($lista)->not->toBeNull();
    expect($lista->sistemas()->pluck('sistemas.id')->sort()->values()->all())
        ->toBe(collect([$sistemaA->id, $sistemaB->id])->sort()->values()->all());
    expect($lista->sistema_id)->toBe($sistemaA->id);
});

it('filtra listas por sistema_id usando pivot', function () {
    $sistema = Sistema::factory()->create();
    $lista = Lista::factory()->create([
        'tipo' => 'Tipo de Artículo',
        'nombre' => 'Filtro Pivot',
        'sistema_id' => null,
    ]);
    $lista->sistemas()->attach($sistema->id);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/listas?tipo=Tipo de Artículo&sistema_id='.$sistema->id);

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($lista->id);
});

it('muestra articulos en detalle de sistema', function () {
    $sistema = Sistema::factory()->create();
    $lista = Lista::factory()->create([
        'tipo' => 'Tipo de Artículo',
        'nombre' => 'Valvula Show',
    ]);
    $lista->sistemas()->attach($sistema->id);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/sistemas/'.$sistema->id);

    $response->assertOk();
    $articulos = $response->json('data.articulos');
    expect(collect($articulos)->pluck('id')->all())->toContain($lista->id);
});

it('sincroniza tipos de articulo desde endpoint de sistema', function () {
    $sistema = Sistema::factory()->create();
    $listaA = Lista::factory()->create(['tipo' => 'Tipo de Artículo', 'nombre' => 'Tipo A']);
    $listaB = Lista::factory()->create(['tipo' => 'Tipo de Artículo', 'nombre' => 'Tipo B']);
    $listaA->sistemas()->attach($sistema->id);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/sistemas/'.$sistema->id.'/tipos-articulo', [
            'lista_ids' => [$listaB->id],
        ]);

    $response->assertOk();
    expect($sistema->listas()->where('tipo', 'Tipo de Artículo')->pluck('listas.id')->all())
        ->toBe([$listaB->id]);
    expect($listaA->fresh()->sistema_id)->toBeNull();
    expect($listaB->fresh()->sistema_id)->toBe($sistema->id);
});
