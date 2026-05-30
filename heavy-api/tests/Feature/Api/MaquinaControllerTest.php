<?php

/**
 * Tests de Feature para Máquinas
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);

    $this->user = createUserWithRole('Administrador');
    $this->tipoMaquina = \App\Models\Lista::factory()->tipoMaquina()->create();
    $this->fabricante = \App\Models\Lista::factory()->fabricante()->create();
});

it('requiere autenticación para listar máquinas', function () {
    $this->getJson('/v1/maquinas')->assertStatus(401);
});

it('permite listar máquinas', function () {
    \App\Models\Maquina::factory()->count(5)->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/maquinas');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'tipo', 'modelo', 'fabricante_id', 'serie', 'estado_revision'],
            ],
            'meta' => ['current_page', 'total'],
        ]);
});

it('permite crear máquina', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/maquinas', [
            'tipo' => $this->tipoMaquina->id,
            'modelo' => 'CAT 320',
            'fabricante_id' => $this->fabricante->id,
            'serie' => 'ABC123456',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => ['id', 'tipo', 'modelo', 'fabricante_id', 'serie', 'estado_revision'],
            'message',
        ]);

    expectDatabaseHas('maquinas', [
        'modelo' => 'Cat 320',
        'serie' => 'ABC123456',
    ]);
});

it('permite actualizar máquina', function () {
    $maquina = \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
        'estado_revision' => 'por_revisar',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/maquinas/{$maquina->id}", [
            'modelo' => 'CAT 320 ACTUALIZADO',
            'estado_revision' => 'revisado',
        ]);

    $response->assertStatus(200);

    $maquina->refresh();
    expect($maquina->modelo)->toBe('Cat 320 Actualizado')
        ->and($maquina->estado_revision)->toBe('revisado');
});

it('rechaza crear máquina sin tipo', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/maquinas', [
            'modelo' => 'CAT 320',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tipo', 'fabricante_id']);
});

it('permite ver detalle de máquina', function () {
    $maquina = \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/maquinas/{$maquina->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $maquina->id,
                'modelo' => $maquina->modelo,
            ],
        ]);
});

it('permite filtrar por tipo', function () {
    $tipo2 = \App\Models\Lista::factory()->tipoMaquina()->create();

    \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);
    \App\Models\Maquina::factory()->create([
        'tipo' => $tipo2->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/maquinas?tipo={$this->tipoMaquina->id}");

    $response->assertStatus(200);
    expect($response->json('meta.total'))->toBe(1);
});

it('permite filtrar por fabricante', function () {
    $fabricante2 = \App\Models\Lista::factory()->fabricante()->create();

    \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);
    \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $fabricante2->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/maquinas?fabricante_id={$this->fabricante->id}");

    $response->assertStatus(200);
    expect($response->json('meta.total'))->toBe(1);
});

it('rechaza crear máquina con estado inválido', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/maquinas', [
            'tipo' => $this->tipoMaquina->id,
            'modelo' => 'CAT 320',
            'fabricante_id' => $this->fabricante->id,
            'estado_revision' => 'estado_invalido',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['estado_revision']);
});

it('estado revision se muestra en respuesta', function () {
    $maquina = \App\Models\Maquina::factory()->revisada()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/maquinas/{$maquina->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.estado_revision', 'revisado');
});

it('permite crear máquina con componentes', function () {
    $sistema = \App\Models\Lista::factory()->create(['tipo' => 'Sistema']);
    $marca = \App\Models\Lista::factory()->create(['tipo' => 'Marca']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/maquinas', [
            'tipo' => $this->tipoMaquina->id,
            'modelo' => 'CAT 320 CON COMPONENTES',
            'fabricante_id' => $this->fabricante->id,
            'serie' => 'COMP123',
            'componentes' => [
                [
                    'sistema_id' => $sistema->id,
                    'marca_id' => $marca->id,
                    'modelo' => 'Motor 123',
                    'serie' => 'S123',
                    'comentario' => 'Motor original',
                ],
            ],
        ]);

    $response->assertStatus(201);

    $maquinaId = $response->json('data.id');
    expectDatabaseHas('componentes_maquina', [
        'maquina_id' => $maquinaId,
        'modelo' => 'Motor 123',
    ]);
});

it('permite actualizar componentes de máquina', function () {
    $maquina = \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $sistema = \App\Models\Lista::factory()->create(['tipo' => 'Sistema']);
    $componenteExistente = \App\Models\ComponenteMaquina::create([
        'maquina_id' => $maquina->id,
        'sistema_id' => $sistema->id,
        'modelo' => 'Modelo Antiguo',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson("/v1/maquinas/{$maquina->id}", [
            '_method' => 'PUT',
            'modelo' => $maquina->modelo,
            'componentes' => [
                [
                    'id' => $componenteExistente->id,
                    'sistema_id' => $sistema->id,
                    'modelo' => 'Modelo Actualizado',
                ],
                [
                    'sistema_id' => $sistema->id,
                    'modelo' => 'Nuevo Componente',
                ],
            ],
        ]);

    $response->assertStatus(200);

    expectDatabaseHas('componentes_maquina', [
        'id' => $componenteExistente->id,
        'modelo' => 'Modelo Actualizado',
    ]);

    andDatabaseHas('componentes_maquina', [
        'maquina_id' => $maquina->id,
        'modelo' => 'Nuevo Componente',
    ]);
});

it('permite filtrar por maquinas disponibles', function () {
    $maquinaAsignada = \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);
    $maquinaLibre = \App\Models\Maquina::factory()->create([
        'tipo' => $this->tipoMaquina->id,
        'fabricante_id' => $this->fabricante->id,
    ]);

    $tercero = \App\Models\Tercero::factory()->create();
    $maquinaAsignada->terceros()->attach($tercero->id);

    // Listar disponibles sin excepción
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/maquinas?disponibles=true');

    $response->assertStatus(200);
    // Solo debe retornar la máquina libre
    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($maquinaLibre->id);

    // Listar disponibles exceptuando el tercero al que está asignada
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/maquinas?disponibles=true&except_tercero_id={$tercero->id}");

    $response->assertStatus(200);
    // Debe retornar ambas máquinas
    expect($response->json('data'))->toHaveCount(2);
});
