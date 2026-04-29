<?php

/**
 * Tests de Feature para Usuarios
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);
});

it('super admin puede listar usuarios', function () {
    $admin = createUserWithRole('super_admin');
    \App\Models\User::factory()->count(3)->create();

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/v1/users');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'meta']);
});

it('vendedor no puede acceder a usuarios', function () {
    $vendedor = createUserWithRole('Vendedor');

    $this->actingAs($vendedor, 'sanctum')
        ->getJson('/v1/users')->assertStatus(403);
});

it('super admin puede crear usuario', function () {
    $admin = createUserWithRole('super_admin');

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/v1/users', [
            'name' => 'Nuevo Test',
            'email' => 'nuevo@test.com',
            'password' => 'Password123!',
            'roles' => ['Vendedor'],
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.email', 'nuevo@test.com');

    expectDatabaseHas('users', ['email' => 'nuevo@test.com']);
});

it('administrador no puede asignar rol super admin', function () {
    $admin = createUserWithRole('Administrador');

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/v1/users', [
            'name' => 'Intento Admin',
            'email' => 'intento@test.com',
            'password' => 'Password123!',
            'roles' => ['super_admin'],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['roles']);
});

it('usuario no puede eliminarse a sí mismo', function () {
    $admin = createUserWithRole('super_admin');

    $response = $this->actingAs($admin, 'sanctum')
        ->deleteJson("/v1/users/{$admin->id}");

    $response->assertStatus(422)
        ->assertJsonPath('message', 'No puedes eliminar tu propio usuario');
});

it('super admin puede eliminar otro usuario', function () {
    $admin = createUserWithRole('super_admin');
    $otroUser = \App\Models\User::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/v1/users/{$otroUser->id}")->assertStatus(204);

    expectDatabaseMissing('users', ['id' => $otroUser->id]);
});
