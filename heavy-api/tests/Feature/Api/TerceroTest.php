<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\{User, Tercero};
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $this->user = User::factory()->create();
        $this->user->assignRole('Vendedor');
    }

    /**
     * Test: Listar terceros
     */
    public function test_puede_listar_terceros(): void
    {
        Tercero::factory()->count(5)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/terceros');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'documento', 'razon_social', 'tipo_tercero'],
                ],
            ]);
    }

    /**
     * Test: Crear tercero con datos válidos
     */
    public function test_puede_crear_tercero(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/terceros', [
                'tipo_documento' => 'NIT',
                'documento' => '900123456-7',
                'razon_social' => 'Empresa de Prueba S.A.S.',
                'tipo_tercero' => 'Juridico',
                'email' => 'contacto@empresa.com',
                'es_cliente' => true,
                'es_proveedor' => false,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data', 'message']);

        $this->assertDatabaseHas('terceros', [
            'documento' => '900123456-7',
            'razon_social' => 'Empresa de Prueba S.A.S.',
        ]);
    }

    /**
     * Test: No puede crear tercero con documento duplicado
     */
    public function test_no_puede_crear_tercero_con_documento_duplicado(): void
    {
        Tercero::factory()->create(['documento' => '900123456-7']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/terceros', [
                'tipo_documento' => 'NIT',
                'documento' => '900123456-7',
                'razon_social' => 'Otra Empresa',
                'tipo_tercero' => 'Juridico',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['documento']);
    }

    /**
     * Test: Ver detalle de tercero
     */
    public function test_puede_ver_detalle_de_tercero(): void
    {
        $tercero = Tercero::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/terceros/{$tercero->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $tercero->id,
                    'documento' => $tercero->documento,
                ],
            ]);
    }

    /**
     * Test: Actualizar tercero
     */
    public function test_puede_actualizar_tercero(): void
    {
        $tercero = Tercero::factory()->create([
            'razon_social' => 'Nombre Original',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/terceros/{$tercero->id}", [
                'razon_social' => 'Nombre Actualizado',
                'telefono' => '3001234567',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('terceros', [
            'id' => $tercero->id,
            'razon_social' => 'Nombre Actualizado',
            'telefono' => '3001234567',
        ]);
    }

    /**
     * Test: Eliminar tercero
     */
    public function test_puede_eliminar_tercero(): void
    {
        $tercero = Tercero::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/terceros/{$tercero->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('terceros', [
            'id' => $tercero->id,
        ]);
    }

    /**
     * Test: Filtrar por tipo de tercero
     */
    public function test_puede_filtrar_por_tipo_tercero(): void
    {
        Tercero::factory()->create(['tipo_tercero' => 'Natural']);
        Tercero::factory()->create(['tipo_tercero' => 'Juridico']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/terceros?tipo_tercero=Natural');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test: Buscar terceros por nombre o documento
     */
    public function test_puede_buscar_terceros(): void
    {
        Tercero::factory()->create(['razon_social' => 'ABC Empresa']);
        Tercero::factory()->create(['razon_social' => 'XYZ Compañía']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/terceros?search=ABC');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
