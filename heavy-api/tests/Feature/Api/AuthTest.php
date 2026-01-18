<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de Feature para Autenticación API
 * 
 * Prueba todos los endpoints de autenticación con Sanctum
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Registro de usuario exitoso
     */
    public function test_usuario_puede_registrarse(): void
    {
        $response = $this->postJson('/api/v1/register', [
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

        $this->assertDatabaseHas('users', [
            'email' => 'juan@example.com',
        ]);
    }

    /**
     * Test: Registro falla sin datos obligatorios
     */
    public function test_registro_falla_sin_datos_obligatorios(): void
    {
        $response = $this->postJson('/api/v1/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /**
     * Test: Registro falla con email duplicado
     */
    public function test_registro_falla_con_email_duplicado(): void
    {
        User::factory()->create(['email' => 'existente@example.com']);

        $response = $this->postJson('/api/v1/register', [
            'name' => 'Usuario Nuevo',
            'email' => 'existente@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Login exitoso con credenciales correctas
     */
    public function test_usuario_puede_hacer_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/login', [
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
    }

    /**
     * Test: Login falla con credenciales incorrectas
     */
    public function test_login_falla_con_credenciales_incorrectas(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'test@example.com',
            'password' => 'password_incorrecta',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test: Usuario autenticado puede obtener su información
     */
    public function test_usuario_autenticado_puede_obtener_su_info(): void
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/me');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);
    }

    /**
     * Test: Usuario puede cerrar sesión
     */
    public function test_usuario_puede_hacer_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Sesión cerrada exitosamente']);

        // Verificar que el token fue revocado
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    /**
     * Test: Usuario sin autenticar no puede acceder a rutas protegidas
     */
    public function test_rutas_protegidas_requieren_autenticacion(): void
    {
        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(401);
    }

    /**
     * Test: Usuario puede refrescar su token
     */
    public function test_usuario_puede_refrescar_token(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/refresh');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => ['access_token', 'token_type', 'expires_in'],
            ]);
    }

    /**
     * Test: Usuario puede listar sus tokens activos
     */
    public function test_usuario_puede_listar_tokens_activos(): void
    {
        $user = User::factory()->create();
        $user->createToken('dispositivo-1');
        $user->createToken('dispositivo-2');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/tokens');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    ['id', 'name', 'created_at'],
                ],
                'total',
            ])
            ->assertJsonCount(2, 'data');
    }
}
