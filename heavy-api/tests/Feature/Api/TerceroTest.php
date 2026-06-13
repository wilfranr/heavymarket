<?php

use App\Models\Maquina;
use App\Models\Tercero;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para Terceros
 */
beforeEach(function () {
    foreach (['Vendedor', 'super_admin', 'Administrador', 'Analista', 'Logistica', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Vendedor');
});

it('permite listar terceros', function () {
    Tercero::factory()->count(5)->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/terceros');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'tipo_documento', 'numero_documento', 'nombre', 'tipo'],
            ],
        ]);
});

it('permite crear tercero', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros', [
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456-7',
            'nombre' => 'Empresa de Prueba S.A.S.',
            'tipo' => 'Cliente',
            'email' => 'contacto@empresa.com',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['data', 'message']);

    expectDatabaseHas('terceros', [
        'numero_documento' => '900123456-7',
    ]);

    $creado = Tercero::query()->where('numero_documento', '900123456-7')->first();
    expect($creado)->not->toBeNull()
        ->and(strtolower($creado->nombre))->toContain('empresa');
});

it('rechaza crear tercero con documento duplicado', function () {
    Tercero::factory()->create(['numero_documento' => '900123456-7']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros', [
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456-7',
            'nombre' => 'Otra Empresa',
            'tipo' => 'Cliente',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['numero_documento']);
});

it('permite ver detalle de tercero', function () {
    $tercero = Tercero::factory()->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/terceros/{$tercero->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $tercero->id,
                'numero_documento' => $tercero->numero_documento,
            ],
        ]);
});

it('permite actualizar tercero', function () {
    $tercero = Tercero::factory()->create([
        'nombre' => 'Nombre Original',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/terceros/{$tercero->id}", [
            'nombre' => 'Nombre Actualizado',
            'tipo' => $tercero->tipo,
            'telefono' => '3001234567',
        ]);

    $response->assertStatus(200);

    expectDatabaseHas('terceros', [
        'id' => $tercero->id,
        'nombre' => 'Nombre Actualizado',
        'telefono' => '3001234567',
    ]);
});

it('permite eliminar tercero', function () {
    $admin = createUserWithRole('Administrador');
    $tercero = Tercero::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/v1/terceros/{$tercero->id}")->assertStatus(204);

    expectDatabaseMissing('terceros', ['id' => $tercero->id]);
});

it('permite filtrar por tipo tercero', function () {
    Tercero::factory()->create(['tipo' => 'Cliente']);
    Tercero::factory()->create(['tipo' => 'Proveedor']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/terceros?tipo=Cliente');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('permite buscar terceros', function () {
    Tercero::factory()->create(['nombre' => 'ABC Empresa SAS']);
    Tercero::factory()->create(['nombre' => 'XYZ Compañía']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/terceros?search=ABC');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('rechaza crear tercero con maquina ya asignada a otro tercero', function () {
    $maquina = Maquina::factory()->create();
    $otroTercero = Tercero::factory()->create();
    $maquina->terceros()->attach($otroTercero->id);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros', [
            'tipo_documento' => 'NIT',
            'numero_documento' => '900999888-1',
            'nombre' => 'Tercero Nuevo',
            'tipo' => 'Cliente',
            'maquina_id' => [$maquina->id],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['maquina_id.0']);
});

it('analista no puede acceder a terceros', function () {
    $analista = createUserWithRole('Analista');

    $this->actingAs($analista, 'sanctum')
        ->getJson('/v1/terceros')
        ->assertStatus(403);
});

it('cliente no puede acceder a terceros', function () {
    $cliente = createUserWithRole('Cliente');

    $this->actingAs($cliente, 'sanctum')
        ->getJson('/v1/terceros')
        ->assertStatus(403);
});

it('permite crear un tercero con maquina_id como un entero unico', function () {
    $maquina = Maquina::factory()->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros', [
            'tipo_documento' => 'NIT',
            'numero_documento' => '900777666-2',
            'nombre' => 'Tercero Con Maquina Entero',
            'tipo' => 'Cliente',
            'telefono' => '12345',
            'direccion' => 'Calle Falsa 123',
            'maquina_id' => $maquina->id, // Enviado como entero
        ]);

    $response->assertStatus(201);
    
    $terceroId = $response->json('data.id');
    $this->assertDatabaseHas('tercero_maquina', [
        'tercero_id' => $terceroId,
        'maquina_id' => $maquina->id,
    ]);
});

it('permite limpiar la maquina de un tercero enviando maquina_id vacio', function () {
    $maquina = Maquina::factory()->create();
    $tercero = Tercero::factory()->create();
    $maquina->terceros()->attach($tercero->id);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/terceros/{$tercero->id}", [
            'nombre' => $tercero->nombre,
            'tipo' => $tercero->tipo,
            'maquina_id' => '', // Enviado como vacio para desasociar
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseMissing('tercero_maquina', [
        'tercero_id' => $tercero->id,
        'maquina_id' => $maquina->id,
    ]);
});
