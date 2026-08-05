<?php

namespace Tests\Feature\Api\V1;

use App\Enums\OrdenCompraEstado;
use App\Models\Lista;
use App\Models\OrdenCompra;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Tercero;
use App\Models\Transportadora;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProviderPortalControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $provider;

    protected $tercero;

    protected $marca;

    protected $categoria;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Role
        Role::create(['name' => 'Proveedor', 'guard_name' => 'web']);

        // Setup Provider User
        $this->provider = User::factory()->create();
        $this->provider->assignRole('Proveedor');

        // Setup Tercero Profile
        $this->tercero = Tercero::factory()->create([
            'user_id' => $this->provider->id,
            'provider_access' => true,
            'tipo' => 'Proveedor',
        ]);

        // Setup Brands and Categories (Listas)
        $this->marca = Lista::create(['nombre' => 'Caterpillar', 'tipo' => 'Fabricantes']);
        $this->categoria = Lista::create(['nombre' => 'Empaques', 'tipo' => 'Categoría Comercial']);

        // Link Provider to Brand and Category
        $this->tercero->fabricantes()->attach($this->marca->id);
        $this->tercero->categoriasComerciales()->attach($this->categoria->id);
    }

    /** @test */
    public function test_it_returns_matching_opportunities_for_provider()
    {
        // 1. Matching Reference (En_Costeo + Correct Brand + Correct Category)
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $refMatch = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // 2. Non-matching (Wrong State)
        $pedidoAnalisis = Pedido::factory()->create(['estado' => 'En_Analisis']);
        $refWrongState = PedidoReferencia::factory()->create([
            'pedido_id' => $pedidoAnalisis->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // 3. Non-matching (Wrong Brand and Category)
        $otraMarca = Lista::create(['nombre' => 'Komatsu', 'tipo' => 'Fabricantes']);
        $otraCat = Lista::create(['nombre' => 'Motores', 'tipo' => 'Categoría Comercial']);
        $refWrongBrand = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $otraMarca->id,
            'categoria_comercial_id' => $otraCat->id,
        ]);

        // 4. Non-matching (Wrong Category and Brand)
        $refWrongCat = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $otraMarca->id,
            'categoria_comercial_id' => $otraCat->id,
        ]);

        $response = $this->actingAs($this->provider)
            ->getJson('/v1/provider/opportunities');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $refMatch->id);
    }

    /** @test */
    public function test_it_excludes_already_costed_references()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // Provider already submitted a cost
        PedidoReferenciaProveedor::create([
            'pedido_referencia_id' => $ref->id,
            'proveedor_id' => $this->tercero->id,
            'cantidad' => 1,
            'costo_unidad' => 100,
        ]);

        $response = $this->actingAs($this->provider)
            ->getJson('/v1/provider/opportunities');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    /** @test */
    public function test_provider_can_submit_costing_offer()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $response = $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 150.50,
                'dias_entrega' => 5,
                'comentario' => 'Oferta de prueba',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Oferta de costeo enviada exitosamente.');

        $this->assertDatabaseHas('pedido_referencia_proveedor', [
            'pedido_referencia_id' => $ref->id,
            'proveedor_id' => $this->tercero->id,
            'costo_unidad' => 150.50,
            'dias_entrega' => 5,
        ]);
    }

    /** @test */
    public function test_provider_can_submit_backorder_and_see_it_in_sent_opportunities()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $response = $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 150.50,
                'dias_entrega' => null,
                'es_backorder' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.dias_entrega', null)
            ->assertJsonPath('data.es_backorder', true);

        $this->assertDatabaseHas('pedido_referencia_proveedor', [
            'pedido_referencia_id' => $ref->id,
            'proveedor_id' => $this->tercero->id,
            'dias_entrega' => null,
            'es_backorder' => true,
        ]);

        $this->actingAs($this->provider)
            ->getJson('/v1/provider/opportunities?status=sent')
            ->assertOk()
            ->assertJsonPath('data.0.form_dias_entrega', null)
            ->assertJsonPath('data.0.form_es_backorder', true);
    }

    /** @test */
    public function test_provider_must_send_delivery_days_for_non_backorder_offer()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 150.50,
                'dias_entrega' => null,
                'es_backorder' => false,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('dias_entrega');
    }

    /** @test */
    public function test_provider_cannot_omit_delivery_days_and_backorder_status()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 150.50,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('es_backorder');
    }

    /** @test */
    public function test_provider_cannot_submit_cost_twice_for_same_reference()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // First submission
        $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 100,
                'dias_entrega' => 3,
            ])->assertStatus(201);

        // Second submission (should fail by validation)
        $response = $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 120,
                'dias_entrega' => 2,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pedido_referencia_id']);
    }

    /** @test */
    public function test_provider_can_list_their_purchase_orders()
    {
        // 1. OC belonging to this provider
        $ocMatch = OrdenCompra::factory()->create([
            'proveedor_id' => $this->tercero->id,
            'estado' => 'Pendiente',
        ]);

        // 2. OC belonging to another provider
        $otroTercero = Tercero::factory()->create(['tipo' => 'Proveedor']);
        $ocOther = OrdenCompra::factory()->create([
            'proveedor_id' => $otroTercero->id,
            'estado' => 'Pendiente',
        ]);

        $response = $this->actingAs($this->provider)
            ->getJson('/v1/provider/purchase-orders');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ocMatch->id);
    }

    /** @test */
    public function test_provider_can_register_dispatch()
    {
        $transportadora = Transportadora::factory()->create();
        $oc = OrdenCompra::factory()->create([
            'proveedor_id' => $this->tercero->id,
            'estado' => OrdenCompraEstado::Pagada->value,
            'color' => OrdenCompraEstado::Pagada->color(),
        ]);

        $response = $this->actingAs($this->provider)
            ->putJson("/v1/provider/purchase-orders/{$oc->id}/dispatch", [
                'guia' => 'GUIA-12345',
                'transportadora_id' => $transportadora->id,
                'fecha_despacho' => now()->toDateString(),
                'observaciones' => 'Despacho realizado por la mañana',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Despacho registrado correctamente.');

        $this->assertDatabaseHas('orden_compras', [
            'id' => $oc->id,
            'guia' => 'GUIA-12345',
            'transportadora_id' => $transportadora->id,
            'estado' => OrdenCompraEstado::Despachada->value,
        ]);
    }

    /** @test */
    public function test_provider_submitting_new_brand_auto_associates_brand()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => null,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $nuevaMarca = Lista::create(['nombre' => 'John Deere', 'tipo' => 'Fabricantes']);

        // Asegurarse de que el proveedor NO tiene asociada esta marca inicialmente
        $this->assertFalse($this->tercero->fabricantes()->where('lista_id', $nuevaMarca->id)->exists());

        $response = $this->actingAs($this->provider)
            ->postJson('/v1/provider/submit-cost', [
                'pedido_referencia_id' => $ref->id,
                'costo_unidad' => 200.00,
                'dias_entrega' => 4,
                'marca_id' => $nuevaMarca->id,
            ]);

        $response->assertStatus(201);

        // Confirmar que la marca ahora está asociada al proveedor
        $this->assertTrue($this->tercero->fresh()->fabricantes()->where('lista_id', $nuevaMarca->id)->exists());
    }

    /** @test */
    public function test_provider_can_filter_opportunities_by_sent_status()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // Crear una oferta enviada (estado 0)
        PedidoReferenciaProveedor::create([
            'pedido_referencia_id' => $ref->id,
            'referencia_id' => $ref->referencia_id,
            'proveedor_id' => $this->tercero->id,
            'marca_id' => $this->marca->id,
            'costo_unidad' => 120.00,
            'dias_entrega' => 3,
            'cantidad' => 1,
            'estado' => 0,
            'utilidad' => 0.00,
            'ubicacion' => 'Nacional',
            'Entrega' => 'Programada',
        ]);

        $response = $this->actingAs($this->provider)
            ->getJson('/v1/provider/opportunities?status=sent');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ref->id)
            ->assertJsonPath('data.0.already_costed', true);

        expect((float) $response->json('data.0.form_costo'))->toEqual(120.00);
    }

    /** @test */
    public function test_provider_can_filter_opportunities_by_approved_status()
    {
        $pedido = Pedido::factory()->create(['estado' => 'En_Costeo']);
        $ref = PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        // Crear una oferta aprobada (estado 1)
        PedidoReferenciaProveedor::create([
            'pedido_referencia_id' => $ref->id,
            'referencia_id' => $ref->referencia_id,
            'proveedor_id' => $this->tercero->id,
            'marca_id' => $this->marca->id,
            'costo_unidad' => 180.00,
            'dias_entrega' => 0,
            'cantidad' => 1,
            'estado' => 1,
            'utilidad' => 0.00,
            'ubicacion' => 'Nacional',
            'Entrega' => 'Inmediata',
        ]);

        $response = $this->actingAs($this->provider)
            ->getJson('/v1/provider/opportunities?status=approved');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ref->id)
            ->assertJsonPath('data.0.already_costed', true);

        expect((float) $response->json('data.0.form_costo'))->toEqual(180.00);
    }
}
