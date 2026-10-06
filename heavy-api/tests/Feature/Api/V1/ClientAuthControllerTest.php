<?php

use App\Models\User;

/**
 * Tests de login desde la landing (modal exclusivo de Cliente).
 *
 * Root cause de #182/#160: antes de este fix, cualquier usuario (incluidos
 * empleados internos) podia iniciar sesion aqui sin validacion de rol,
 * quedando con una sesion de "clientToken" que el logout de la app interna
 * no revocaba, generando la confusion de "no puedo cerrar sesion". Proveedor
 * inicia sesion desde la administracion (/auth/login), igual que los demas
 * roles -- el modal de la landing es exclusivo de Cliente.
 */
beforeEach(function () {
    seedRoles(['Proveedor']);
});

it('permite login a un usuario con rol Cliente', function () {
    $user = createUserWithRole('Cliente', [
        'email' => 'cliente@example.com',
    ]);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'cliente@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['message', 'user' => ['id', 'name', 'email', 'roles'], 'token']);
});

it('rechaza login a un empleado interno (rol Logistica) desde la landing', function () {
    $user = createUserWithRole('Logistica', [
        'email' => 'logistica@example.com',
    ]);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'logistica@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('rechaza login a un proveedor desde la landing (debe usar la administracion)', function () {
    $user = createUserWithRole('Proveedor', [
        'email' => 'proveedor@example.com',
    ]);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'proveedor@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('rechaza login a un usuario con rol interno aunque tambien tenga rol Cliente (doble rol)', function () {
    $user = User::factory()->create([
        'email' => 'superadmin-cliente@example.com',
    ]);
    $user->assignRole(['super_admin', 'Cliente']);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'superadmin-cliente@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('rechaza login a un usuario con rol interno aunque tambien tenga rol Proveedor (doble rol)', function () {
    $user = User::factory()->create([
        'email' => 'superadmin-proveedor@example.com',
    ]);
    $user->assignRole(['super_admin', 'Proveedor']);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'superadmin-proveedor@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('rechaza login a un usuario sin ningun rol asignado', function () {
    User::factory()->create([
        'email' => 'sin-rol@example.com',
    ]);

    $response = $this->postJson('/v1/landing/auth/login', [
        'email' => 'sin-rol@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});
