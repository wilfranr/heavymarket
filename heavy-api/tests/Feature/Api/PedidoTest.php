<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\{User, Pedido, Tercero, Fabricante, Maquina};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de Feature para el endpoint de Pedidos
 */
class PedidoTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Tercero $tercero;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear usuario con rol permitido
        $this->user = User::factory()->create();
        $this->user->assignRole('Vendedor');

        // Crear tercero para los tests
        $this->tercero = Tercero::factory()->create();
    }

    /**
     * Test: Listar pedidos requiere autenticación
     */
    public function test_listar_pedidos_requiere_autenticacion(): void
    {
        $response = $this->getJson('/api/v1/pedidos');

        $response->assertStatus(401);
    }

    /**
     * Test: Usuario autenticado puede listar pedidos
     */
    public function test_usuario_puede_listar_pedidos(): void
    {
        Pedido::factory()->count(5)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/pedidos');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'tercero_id', 'estado', 'created_at'],
                ],
                'meta' => ['current_page', 'total'],
            ]);
    }

    /**
     * Test: Crear pedido con datos válidos
     */
    public function test_puede_crear_pedido_con_datos_validos(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/pedidos', [
                'tercero_id' => $this->tercero->id,
                'estado' => 'Nuevo',
                'direccion' => 'Calle 123 #45-67',
                'comentario' => 'Pedido de prueba',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'tercero_id', 'estado'],
                'message',
            ]);

        $this->assertDatabaseHas('pedidos', [
            'tercero_id' => $this->tercero->id,
            'estado' => 'Nuevo',
        ]);
    }

    /**
     * Test: Crear pedido falla sin tercero_id
     */
    public function test_crear_pedido_falla_sin_tercero_id(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/pedidos', [
                'estado' => 'Nuevo',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tercero_id']);
    }

    /**
     * Test: Ver detalle de un pedido específico
     */
    public function test_puede_ver_detalle_de_pedido(): void
    {
        $pedido = Pedido::factory()->create([
            'user_id' => $this->user->id,
            'tercero_id' => $this->tercero->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/pedidos/{$pedido->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $pedido->id,
                    'tercero_id' => $this->tercero->id,
                ],
            ]);
    }

    /**
     * Test: Actualizar pedido existente
     */
    public function test_puede_actualizar_pedido(): void
    {
        $pedido = Pedido::factory()->create([
            'user_id' => $this->user->id,
            'tercero_id' => $this->tercero->id,
            'estado' => 'Nuevo',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/pedidos/{$pedido->id}", [
                'estado' => 'Enviado',
                'comentario' => 'Actualizado',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => ['estado' => 'Enviado'],
                'message' => 'Pedido actualizado exitosamente',
            ]);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'estado' => 'Enviado',
        ]);
    }

    /**
     * Test: Eliminar pedido
     */
    public function test_puede_eliminar_pedido(): void
    {
        $pedido = Pedido::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/pedidos/{$pedido->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('pedidos', [
            'id' => $pedido->id,
        ]);
    }

    /**
     * Test: Filtrar pedidos por estado
     */
    public function test_puede_filtrar_pedidos_por_estado(): void
    {
        Pedido::factory()->create(['estado' => 'Nuevo']);
        Pedido::factory()->create(['estado' => 'Enviado']);
        Pedido::factory()->create(['estado' => 'Nuevo']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/pedidos?estado=Nuevo');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /**
     * Test: Paginación funciona correctamente
     */
    public function test_paginacion_funciona_correctamente(): void
    {
        Pedido::factory()->count(20)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/pedidos?per_page=10');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10);
    }
}
