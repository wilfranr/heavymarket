<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Aseguramos que existan los roles necesarios para las pruebas
        Role::firstOrCreate(['name' => 'super_admin']);
        Role::firstOrCreate(['name' => 'Administrador']);
        Role::firstOrCreate(['name' => 'Vendedor']);
    }

    public function test_super_admin_puede_listar_usuarios(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_vendedor_no_puede_acceder_a_usuarios(): void
    {
        $vendedor = User::factory()->create();
        $vendedor->assignRole('Vendedor');

        $response = $this->actingAs($vendedor)
            ->getJson('/api/v1/users');

        $response->assertStatus(403);
    }

    public function test_super_admin_puede_crear_usuario(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/users', [
                'name' => 'Nuevo Test',
                'email' => 'nuevo@test.com',
                'password' => 'Password123!',
                'roles' => ['Vendedor'],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'nuevo@test.com');

        $this->assertDatabaseHas('users', ['email' => 'nuevo@test.com']);
    }

    public function test_administrador_no_puede_asignar_rol_super_admin(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/users', [
                'name' => 'Intento Admin',
                'email' => 'intento@test.com',
                'password' => 'Password123!',
                'roles' => ['super_admin'],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['roles']);
    }

    public function test_usuario_no_puede_eliminarse_a_si_mismo(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->deleteJson("/api/v1/users/{$admin->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'No puedes eliminar tu propio usuario');
    }

    public function test_super_admin_puede_eliminar_otro_usuario(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $otroUser = User::factory()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/v1/users/{$otroUser->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $otroUser->id]);
    }
}
