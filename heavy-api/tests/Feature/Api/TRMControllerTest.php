<?php

use App\Models\TRM;
use Spatie\Permission\Models\Role;

/**
 * Tests de Feature para TRMController
 */
beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->user = createUserWithRole('Administrador');
});

it('index devuelve lista paginada de TRM', function () {
    TRM::create(['trm' => 4000.00, 'fecha' => '2024-01-01']);
    TRM::create(['trm' => 4100.00, 'fecha' => '2024-01-02']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/trms');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
});

it('index requiere autenticacion', function () {
    $response = $this->getJson('/v1/trms');
    $response->assertStatus(401);
});

it('store crea una TRM exitosamente', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/trms', [
            'trm' => 4500.50,
            'fecha' => '2024-01-15',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'trm', 'fecha'],
        ]);
});

it('show devuelve una TRM especifica', function () {
    $trm = TRM::create(['trm' => 4000.00, 'fecha' => '2024-01-01']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/trms/'.$trm->id);

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $trm->id);
});

it('update modifica una TRM', function () {
    $trm = TRM::create(['trm' => 4000.00, 'fecha' => '2024-01-01']);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson('/v1/trms/'.$trm->id, [
            'trm' => 4500.50,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.trm', 4500.50);
});

it('destroy elimina una TRM', function () {
    $trm = TRM::create(['trm' => 4000.00, 'fecha' => '2024-01-01']);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson('/v1/trms/'.$trm->id)
        ->assertStatus(204);
});
