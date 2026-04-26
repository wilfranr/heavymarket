<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Sistema;
use App\Models\Lista;
use App\Models\Referencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class Issue101Test extends TestCase
{
    use RefreshDatabase;

    private User $analista;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Analista', 'guard_name' => 'web']);
        $this->analista = User::factory()->create();
        $this->analista->assignRole('Analista');
    }

    /**
     * Test: El API debe permitir y retornar múltiples ítems con el mismo sistema/tipo pero diferentes cantidades.
     */
    public function test_api_retorna_items_con_mismo_metadata_pero_diferente_cantidad(): void
    {
        $sistema = Sistema::create(['nombre' => 'SISTEMA TEST']);
        $lista = Lista::factory()->create(['tipo' => 'Categoría Comercial']);
        $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

        // Crear dos ítems con mismo sistema, lista y definición, pero diferente cantidad
        PedidoReferencia::create([
            'pedido_id' => $pedido->id,
            'sistema_id' => $sistema->id,
            'lista_id' => $lista->id,
            'definicion' => 'Filtro de Aceite',
            'cantidad' => 1,
            'estado' => 1
        ]);

        PedidoReferencia::create([
            'pedido_id' => $pedido->id,
            'sistema_id' => $sistema->id,
            'lista_id' => $lista->id,
            'definicion' => 'Filtro de Aceite',
            'cantidad' => 2,
            'estado' => 1
        ]);

        $response = $this->actingAs($this->analista, 'sanctum')
            ->getJson("/v1/pedidos/{$pedido->id}");

        $response->assertStatus(200);
        $referencias = $response->json('data.referencias');

        $this->assertCount(2, $referencias);
    }

    /**
     * Test: Al guardar el análisis, se deben persistir ítems separados si vienen en el payload.
     */
    public function test_puede_guardar_analisis_con_items_similares_separados(): void
    {
        $sistema = Sistema::create(['nombre' => 'SISTEMA TEST']);
        $lista = Lista::factory()->create(['tipo' => 'Categoría Comercial']);
        $ref1 = Referencia::factory()->create();
        $ref2 = Referencia::factory()->create();
        $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

        $payload = [
            'referencias' => [
                [
                    'id' => null,
                    'referencia_id' => $ref1->id,
                    'sistema_id' => $sistema->id,
                    'lista_id' => $lista->id,
                    'cantidad' => 1,
                    'definicion' => 'Item Similar',
                    'estado' => 1
                ],
                [
                    'id' => null,
                    'referencia_id' => $ref2->id,
                    'sistema_id' => $sistema->id,
                    'lista_id' => $lista->id,
                    'cantidad' => 2,
                    'definicion' => 'Item Similar',
                    'estado' => 1
                ]
            ]
        ];

        $response = $this->actingAs($this->analista, 'sanctum')
            ->putJson("/v1/pedidos/{$pedido->id}", $payload);

        $response->assertStatus(200);
        
        $this->assertDatabaseCount('pedido_referencia', 2);
        $this->assertDatabaseHas('pedido_referencia', ['cantidad' => 1, 'definicion' => 'Item Similar']);
        $this->assertDatabaseHas('pedido_referencia', ['cantidad' => 2, 'definicion' => 'Item Similar']);
    }
}
