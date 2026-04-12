<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Referencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReferenciaBulkSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user', 'Cliente'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
    }

    public function test_bulk_search_encuentra_referencias_existentes_para_analista(): void
    {
        $refA = Referencia::factory()->withReferencia('REF-BULK-A')->create();
        Referencia::factory()->withReferencia('REF-BULK-B')->create();

        $user = User::factory()->create();
        $user->assignRole('Analista');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/v1/referencias/bulk-search', [
                'items' => [
                    ['codigo' => 'ref-bulk-a', 'cantidad' => 2],
                    ['codigo' => 'REF-BULK-B', 'cantidad' => 1],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', '2 referencia(s) encontrada(s)')
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.referencia_id', $refA->id)
            ->assertJsonPath('data.0.cantidad', 2)
            ->assertJsonPath('no_encontrados', []);
    }

    public function test_bulk_search_reporta_no_encontrados_sin_crear(): void
    {
        Referencia::factory()->withReferencia('SOLO-ESTA')->create();

        $user = User::factory()->create();
        $user->assignRole('Vendedor');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/v1/referencias/bulk-search', [
                'items' => [
                    ['codigo' => 'SOLO-ESTA', 'cantidad' => 1],
                    ['codigo' => 'NO-EXISTE', 'cantidad' => 1],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('no_encontrados', ['NO-EXISTE']);

        $this->assertDatabaseCount('referencias', 1);
    }

    public function test_bulk_search_requiere_autenticacion(): void
    {
        $response = $this->postJson('/v1/referencias/bulk-search', [
            'items' => [['codigo' => 'X', 'cantidad' => 1]],
        ]);

        $response->assertStatus(401);
    }

    public function test_bulk_search_rechaza_usuario_sin_rol_autorizado(): void
    {
        Referencia::factory()->withReferencia('R1')->create();

        $user = User::factory()->create();
        $user->assignRole('Cliente');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/v1/referencias/bulk-search', [
                'items' => [['codigo' => 'R1', 'cantidad' => 1]],
            ]);

        $response->assertStatus(403);
    }
}
