<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests de Feature para el endpoint de Terceros
 */
class TerceroTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['Vendedor', 'super_admin', 'Administrador', 'Analista', 'Logistica', 'Cliente'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        $this->user = User::factory()->create();
        $this->user->assignRole('Vendedor');
    }

    public function test_puede_listar_terceros(): void
    {
        Tercero::factory()->count(5)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/v1/terceros');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'tipo_documento', 'numero_documento', 'nombre', 'tipo'],
                ],
            ]);
    }

    public function test_puede_crear_tercero(): void
    {
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

        $this->assertDatabaseHas('terceros', [
            'numero_documento' => '900123456-7',
        ]);
        $creado = Tercero::query()->where('numero_documento', '900123456-7')->first();
        $this->assertNotNull($creado);
        $this->assertStringContainsStringIgnoringCase('empresa', (string) $creado->nombre);
    }

    public function test_no_puede_crear_tercero_con_documento_duplicado(): void
    {
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
    }

    public function test_puede_ver_detalle_de_tercero(): void
    {
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
    }

    public function test_puede_actualizar_tercero(): void
    {
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

        $this->assertDatabaseHas('terceros', [
            'id' => $tercero->id,
            'nombre' => 'Nombre Actualizado',
            'telefono' => '3001234567',
        ]);
    }

    public function test_puede_eliminar_tercero(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $tercero = Tercero::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/v1/terceros/{$tercero->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('terceros', [
            'id' => $tercero->id,
        ]);
    }

    public function test_puede_filtrar_por_tipo_tercero(): void
    {
        Tercero::factory()->create(['tipo' => 'Cliente']);
        Tercero::factory()->create(['tipo' => 'Proveedor']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/v1/terceros?tipo=Cliente');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_puede_buscar_terceros(): void
    {
        Tercero::factory()->create(['nombre' => 'ABC Empresa SAS']);
        Tercero::factory()->create(['nombre' => 'XYZ Compañía']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/v1/terceros?search=ABC');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
