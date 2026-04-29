<?php

/**
 * Tests de autenticación API con Sanctum
 */

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'panel_user', 'guard_name' => 'web']);
});

it('permite registro de usuario exitoso', function () {
    $response = $this->postJson('/v1/register', [
        'name' => 'Juan Pérez',
        'email' => 'juan@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'user' => ['id', 'name', 'email', 'roles'],
                'access_token',
                'token_type',
                'expires_in',
            ],
        ]);

    expectDatabaseHas('users', ['email' => 'juan@example.com']);
});

it('rechaza registro sin datos obligatorios', function () {
    $response = $this->postJson('/v1/register', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('rechaza registro con email duplicado', function () {
    \App\Models\User::factory()->create(['email' => 'existente@example.com']);

    $response = $this->postJson('/v1/register', [
        'name' => 'Usuario Nuevo',
        'email' => 'existente@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('permite login con credenciales correctas', function () {
    $user = \App\Models\User::factory()->create([
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/v1/login', [
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => [
                'user' => ['id', 'name', 'email', 'roles', 'permissions'],
                'access_token',
                'token_type',
            ],
        ]);
});

it('rechaza login con credenciales incorrectas', function () {
    \App\Models\User::factory()->create([
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/v1/login', [
        'email' => 'test@example.com',
        'password' => 'password_incorrecta',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('permite obtener información de usuario autenticado', function () {
    $user = \App\Models\User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/me');

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
});

it('permite cerrar sesión', function () {
    $user = \App\Models\User::factory()->create();
    $token = $user->createToken('test-device')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/v1/logout');

    $response->assertStatus(200)
        ->assertJson(['message' => 'Sesión cerrada exitosamente']);

    expectDatabaseMissing('personal_access_tokens', [
        'tokenable_id' => $user->id,
    ]);
});

it('requiere autenticación para rutas protegidas', function () {
    $response = $this->getJson('/v1/me');

    $response->assertStatus(401);
});

it('permite refrescar token', function () {
    $user = \App\Models\User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/v1/refresh');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => ['access_token', 'token_type', 'expires_in'],
        ]);
});

it('permite listar tokens activos', function () {
    $user = \App\Models\User::factory()->create();
    $user->createToken('dispositivo-1');
    $user->createToken('dispositivo-2');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/v1/tokens');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                ['id', 'name', 'created_at'],
            ],
            'total',
        ])
        ->assertJsonCount(2, 'data');
});
