<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Lista;
use App\Models\Maquina;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests de Feature para el endpoint de Máquinas
 */
class MaquinaControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Lista $tipoMaquina;

    private Lista $fabricante;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear roles necesarios para tests
        Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Vendedor', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);

        // Crear usuario con rol permitido
        $this->user = User::factory()->create();
        $this->user->assignRole('Administrador');

        // Crear tipos y fabricantes para los tests
        $this->tipoMaquina = Lista::factory()->tipoMaquina()->create();
        $this->fabricante = Lista::factory()->fabricante()->create();
    }

    /**
     * Test: Listar máquinas requiere autenticación
     */
    public function test_listar_maquinas_requiere_autenticacion(): void
    {
        $response = $this->getJson('/v1/maquinas');

        $response->assertStatus(401);
    }

    /**
     * Test: Usuario autenticado puede listar máquinas
     */
    public function test_usuario_puede_listar_maquinas(): void
    {
        Maquina::factory()->count(5)->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/v1/maquinas');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'tipo', 'modelo', 'fabricante_id', 'serie', 'estado_revision'],
                ],
                'meta' => ['current_page', 'total'],
            ]);
    }

    /**
     * Test: Puede crear máquina con datos válidos
     */
    public function test_puede_crear_maquina(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/maquinas', [
                'tipo' => $this->tipoMaquina->id,
                'modelo' => 'CAT 320',
                'fabricante_id' => $this->fabricante->id,
                'serie' => 'ABC123456',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'tipo', 'modelo', 'fabricante_id', 'serie', 'estado_revision'],
                'message',
            ]);

        // Verificar que se creó - el modelo se normaliza a title case
        $this->assertDatabaseHas('maquinas', [
            'modelo' => 'Cat 320', // Normalizado por trait
            'serie' => 'ABC123456',
        ]);
        // El estado puede ser cualquiera de los dos valores válidos
        $this->assertTrue(
            $this->getDatabaseMaquinaModel() === 'Cat 320',
            'La máquina debe haber sido creada'
        );
    }

    private function getDatabaseMaquinaModel(): ?string
    {
        return DB::table('maquinas')->where('serie', 'ABC123456')->first()?->modelo;
    }

    /**
     * Test: Puede actualizar máquina
     */
    public function test_puede_actualizar_maquina(): void
    {
        $maquina = Maquina::factory()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
            'estado_revision' => 'por_revisar',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/v1/maquinas/{$maquina->id}", [
                'modelo' => 'CAT 320 ACTUALIZADO',
                'estado_revision' => 'revisado',
            ]);

        $response->assertStatus(200);

        $maquina->refresh();
        // El modelo se normaliza a title case
        $this->assertEquals('Cat 320 Actualizado', $maquina->modelo);
        $this->assertEquals('revisado', $maquina->estado_revision);
    }

    /**
     * Test: Crear máquina falla sin datos requeridos
     */
    public function test_crear_maquina_falta_tipo(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/maquinas', [
                'modelo' => 'CAT 320',
                // falta tipo y fabricante_id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tipo', 'fabricante_id']);
    }

    /**
     * Test: Puede ver detalle de máquina
     */
    public function test_puede_ver_detalle_maquina(): void
    {
        $maquina = Maquina::factory()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/v1/maquinas/{$maquina->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $maquina->id,
                    'modelo' => $maquina->modelo,
                ],
            ]);
    }

    /**
     * Test: Puede filtrar máquinas por tipo
     */
    public function test_puede_filtrar_por_tipo(): void
    {
        $tipo2 = Lista::factory()->tipoMaquina()->create();

        Maquina::factory()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
        ]);
        Maquina::factory()->create([
            'tipo' => $tipo2->id,
            'fabricante_id' => $this->fabricante->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/v1/maquinas?tipo={$this->tipoMaquina->id}");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total'));
    }

    /**
     * Test: Puede filtrar máquinas por fabricante
     */
    public function test_puede_filtrar_por_fabricante(): void
    {
        $fabricante2 = Lista::factory()->fabricante()->create();

        Maquina::factory()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
        ]);
        Maquina::factory()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $fabricante2->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/v1/maquinas?fabricante_id={$this->fabricante->id}");

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total'));
    }

    /**
     * Test: Crear máquina con estado_revision inválido falla
     */
    public function test_crear_maquina_estado_invalido_falla(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/maquinas', [
                'tipo' => $this->tipoMaquina->id,
                'modelo' => 'CAT 320',
                'fabricante_id' => $this->fabricante->id,
                'estado_revision' => 'estado_invalido',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['estado_revision']);
    }

    /**
     * Test: Estado revision se muestra en la respuesta
     */
    public function test_estado_revision_se_muestra_en_respuesta(): void
    {
        $maquina = Maquina::factory()->revisada()->create([
            'tipo' => $this->tipoMaquina->id,
            'fabricante_id' => $this->fabricante->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/v1/maquinas/{$maquina->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.estado_revision', 'revisado');
    }
}
