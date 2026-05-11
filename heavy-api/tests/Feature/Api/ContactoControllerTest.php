<?php

use App\Models\Contacto;
use App\Models\Tercero;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para ContactoController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
    $this->tercero = Tercero::factory()->create();
});

it('index devuelve lista paginada de contactos', function () {
    Contacto::factory()->count(5)->create(['tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ])
        ->assertJsonCount(5, 'data');
});

it('index permite filtrar por tercero_id', function () {
    $tercero2 = Tercero::factory()->create();
    Contacto::factory()->count(3)->create(['tercero_id' => $this->tercero->id]);
    Contacto::factory()->count(2)->create(['tercero_id' => $tercero2->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos?tercero_id='.$this->tercero->id);

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

it('index permite buscar por nombre', function () {
    Contacto::factory()->create(['nombre' => 'Juan Perez', 'tercero_id' => $this->tercero->id]);
    Contacto::factory()->create(['nombre' => 'Maria Lopez', 'tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos?search=Juan');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.nombre', 'Juan Perez');
});

it('index permite buscar por email', function () {
    Contacto::factory()->create(['email' => 'juan@ejemplo.com', 'tercero_id' => $this->tercero->id]);
    Contacto::factory()->create(['email' => 'maria@ejemplo.com', 'tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos?search=juan@');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/contactos');
    $response->assertStatus(401);
});

it('store crea un contacto exitosamente', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/contactos', [
            'tercero_id' => $this->tercero->id,
            'nombre' => 'Contacto Test',
            'email' => 'contacto@test.com',
            'telefono' => '3001234567',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'nombre', 'email', 'tercero_id'],
        ])
        ->assertJsonPath('data.nombre', 'Contacto Test');
});

it('store rejects sin nombre', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/contactos', [
            'tercero_id' => $this->tercero->id,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['nombre']);
});

it('store rejects sin tercero_id', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/contactos', [
            'nombre' => 'Contacto Test',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tercero_id']);
});

it('show devuelve un contacto especifico', function () {
    $contacto = Contacto::factory()->create(['tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos/'.$contacto->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $contacto->id);
});

it('update modifica un contacto', function () {
    $contacto = Contacto::factory()->create(['tercero_id' => $this->tercero->id, 'nombre' => 'Original']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/contactos/'.$contacto->id, [
            'nombre' => 'Actualizado',
            'email' => 'nuevo@test.com',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.nombre', 'Actualizado');
});

it('destroy solo permite a super_admin o Administrador', function () {
    $contacto = Contacto::factory()->create(['tercero_id' => $this->tercero->id]);

    // Vendedor no puede eliminar
    $vendedor = createUserWithRole('Vendedor');
    $this->actingAs($vendedor, 'sanctum')
        ->deleteJson('/v1/contactos/'.$contacto->id)
        ->assertStatus(403);

    // Administrador puede eliminar
    $this->actingAs($this->user, 'sanctum')
        ->deleteJson('/v1/contactos/'.$contacto->id)
        ->assertStatus(204);
});

it('index permite ordenamiento', function () {
    Contacto::factory()->create(['nombre' => 'ZZZ', 'tercero_id' => $this->tercero->id]);
    Contacto::factory()->create(['nombre' => 'AAA', 'tercero_id' => $this->tercero->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/contactos?sort_by=nombre&sort_order=asc');

    $response->assertStatus(200)
        ->assertJsonPath('data.0.nombre', 'AAA');
});
