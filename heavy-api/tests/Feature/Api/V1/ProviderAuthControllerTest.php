<?php

namespace Tests\Feature\Api\V1;

use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProviderAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'Proveedor', 'guard_name' => 'web']);
    }

    /** @test */
    public function test_a_provider_can_register()
    {
        $response = $this->postJson('/v1/auth/provider/register', [
            'name' => 'Proveedor Test',
            'email' => 'provider@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token']);

        $this->assertDatabaseHas('users', ['email' => 'provider@example.com']);
        $this->assertDatabaseHas('terceros', [
            'email' => 'provider@example.com',
            'provider_access' => true,
            'tipo' => 'Proveedor',
        ]);

        $user = User::where('email', 'provider@example.com')->first();
        $this->assertTrue($user->hasRole('Proveedor'));
    }

    /** @test */
    public function test_a_provider_can_login()
    {
        $user = User::factory()->create([
            'email' => 'active@provider.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('Proveedor');

        Tercero::factory()->create([
            'user_id' => $user->id,
            'email' => $user->email,
            'provider_access' => true,
        ]);

        $response = $this->postJson('/v1/auth/provider/login', [
            'email' => 'active@provider.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'user', 'token']);
    }

    /** @test */
    public function test_login_fails_if_provider_access_is_disabled()
    {
        $user = User::factory()->create([
            'email' => 'inactive@provider.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('Proveedor');

        Tercero::factory()->create([
            'user_id' => $user->id,
            'email' => $user->email,
            'provider_access' => false,
        ]);

        $response = $this->postJson('/v1/auth/provider/login', [
            'email' => 'inactive@provider.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Su acceso al portal de proveedores aún no ha sido habilitado.']);
    }
}
