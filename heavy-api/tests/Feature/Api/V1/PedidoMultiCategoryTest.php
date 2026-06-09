<?php

namespace Tests\Feature\Api\V1;

use App\Models\Lista;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PedidoMultiCategoryTest extends TestCase
{
    use RefreshDatabase;

    protected $analista;

    protected $vendedor;

    protected $providerUser;

    protected $terceroProvider;

    protected $marca;

    protected $categoriaA;

    protected $categoriaB;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear Roles
        Role::create(['name' => 'Analista', 'guard_name' => 'web']);
        Role::create(['name' => 'Proveedor', 'guard_name' => 'web']);

        $this->analista = User::factory()->create();
        $this->analista->assignRole('Analista');

        $this->vendedor = User::factory()->create();

        $this->providerUser = User::factory()->create();
        $this->providerUser->assignRole('Proveedor');

        $this->terceroProvider = Tercero::factory()->create([
            'user_id' => $this->providerUser->id,
            'provider_access' => true,
            'tipo' => 'Proveedor',
        ]);

        $this->marca = Lista::create(['nombre' => 'Caterpillar', 'tipo' => 'Fabricantes']);
        $this->categoriaA = Lista::create(['nombre' => 'Empaques', 'tipo' => 'Categoría Comercial']);
        $this->categoriaB = Lista::create(['nombre' => 'Motores', 'tipo' => 'Categoría Comercial']);

        $this->terceroProvider->fabricantes()->attach($this->marca->id);
        // El proveedor solo tiene la Categoría B asignada
        $this->terceroProvider->categoriasComerciales()->attach($this->categoriaB->id);
    }

    /** @test */
    public function test_it_can_associate_multiple_categories_to_a_pedido_reference()
    {
        $pedido = Pedido::factory()->create([
            'user_id' => $this->vendedor->id,
            'estado' => 'En_Analisis',
        ]);

        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
        ]);

        $response = $this->actingAs($this->analista)
            ->putJson("/v1/pedidos/{$pedido->id}", [
                'referencias' => [
                    [
                        'id' => $ref->id,
                        'referencia_id' => $ref->referencia_id,
                        'cantidad' => 2,
                        'categoria_comercial_ids' => [$this->categoriaA->id, $this->categoriaB->id],
                    ],
                ],
            ]);

        $response->assertStatus(200);

        // Validar en la BD
        $this->assertDatabaseHas('analysis_commercial_categories', [
            'pedido_referencia_id' => $ref->id,
            'categoria_comercial_id' => $this->categoriaA->id,
        ]);

        $this->assertDatabaseHas('analysis_commercial_categories', [
            'pedido_referencia_id' => $ref->id,
            'categoria_comercial_id' => $this->categoriaB->id,
        ]);
    }

    /** @test */
    public function test_it_matches_opportunity_with_secondary_categories_in_provider_portal()
    {
        $pedido = Pedido::factory()->create([
            'user_id' => $this->vendedor->id,
            'estado' => 'En_Costeo',
        ]);

        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
        ]);

        // Asociar las categorías a la referencia
        $ref->categoriasComerciales()->attach([$this->categoriaA->id, $this->categoriaB->id]);

        // Ver oportunidades en el portal de proveedores
        $response = $this->actingAs($this->providerUser)
            ->getJson('/v1/provider/opportunities');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ref->id);
    }
}
