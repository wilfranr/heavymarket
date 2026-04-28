<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Cotizacion;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests de Feature para el endpoint de Cotizaciones
 */
class CotizacionControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $analista;
    private User $vendedor;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Administrador');

        $this->analista = User::factory()->create();
        $this->analista->assignRole('Analista');

        $this->vendedor = User::factory()->create();
        $this->vendedor->assignRole('Vendedor');
    }

    public function test_listar_cotizaciones_requiere_autenticacion(): void
    {
        $response = $this->getJson('/v1/cotizaciones');
        $response->assertStatus(401);
    }

    public function test_admin_puede_listar_cotizaciones(): void
    {
        Cotizacion::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/v1/cotizaciones');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'tercero_id', 'pedido_id', 'estado', 'total']
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ]);
    }

    public function test_puede_filtrar_cotizaciones_por_estado(): void
    {
        Cotizacion::factory()->enviada()->count(2)->create();
        Cotizacion::factory()->aprobada()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/v1/cotizaciones?estado=Enviada');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_puede_ver_detalle_de_cotizacion(): void
    {
        $cotizacion = Cotizacion::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/v1/cotizaciones/{$cotizacion->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'estado', 'total', 'pedido_id']
            ]);
    }

    public function test_puede_crear_cotizacion(): void
    {
        $pedido = Pedido::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/v1/cotizaciones', [
                'pedido_id' => $pedido->id,
                'tercero_id' => $pedido->tercero_id,
                'estado' => 'En_Proceso',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Cotización creada exitosamente');

        $this->assertDatabaseHas('cotizaciones', [
            'pedido_id' => $pedido->id,
            'estado' => 'En_Proceso',
        ]);
    }

    public function test_puede_actualizar_cotizacion(): void
    {
        $cotizacion = Cotizacion::factory()->pendiente()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
                'estado' => 'Enviada',
                'observaciones' => 'Cotización enviada al cliente',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.estado', 'Enviada');
    }

    public function test_admin_puede_eliminar_cotizacion(): void
    {
        $cotizacion = Cotizacion::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/v1/cotizaciones/{$cotizacion->id}");

        $response->assertStatus(204);
    }

    public function test_analista_puede_ver_cotizaciones(): void
    {
        $cotizacion = Cotizacion::factory()->create();

        $response = $this->actingAs($this->analista, 'sanctum')
            ->getJson("/v1/cotizaciones/{$cotizacion->id}");

        $response->assertStatus(200);
    }

    public function test_vendedor_puede_ver_sus_cotizaciones(): void
    {
        $cotizacion = Cotizacion::factory()->create(['user_id' => $this->vendedor->id]);

        $response = $this->actingAs($this->vendedor, 'sanctum')
            ->getJson("/v1/cotizaciones/{$cotizacion->id}");

        $response->assertStatus(200);
    }

    public function test_validacion_crear_cotizacion_sin_pedido(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/v1/cotizaciones', [
                'tercero_id' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pedido_id']);
    }

    public function test_validacion_actualizar_estado_invalido(): void
    {
        $cotizacion = Cotizacion::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
                'estado' => 'EstadoInvalido',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['estado']);
    }
}
