<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Articulo;
use App\Models\Referencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests de Feature para el endpoint de Artículos
 */
class ArticuloControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear roles necesarios
        Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        
        // Crear usuario con rol permitido
        $this->user = User::factory()->create();
        $this->user->assignRole('Administrador');
    }

    /**
     * Test: Listar artículos requiere autenticación
     */
    public function test_listar_articulos_requiere_autenticacion(): void
    {
        $response = $this->getJson('/v1/articulos');
        $response->assertStatus(401);
    }

    /**
     * Test: Usuario puede listar artículos
     */
    public function test_usuario_puede_listar_articulos(): void
    {
        Articulo::factory()->count(3)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/v1/articulos');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'definicion', 'descripcionEspecifica', 'peso', 'created_at']
                ],
                'meta' => ['current_page', 'total']
            ]);
    }

    /**
     * Test: Puede ver detalle de un artículo
     */
    public function test_puede_ver_detalle_articulo(): void
    {
        $articulo = Articulo::factory()->create([
            'definicion' => 'Acople Dentado',
            'descripcionEspecifica' => 'Descripción de prueba'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/v1/articulos/{$articulo->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.definicion', 'Acople Dentado')
            ->assertJsonPath('data.descripcionEspecifica', 'Descripción de prueba');
    }

    /**
     * Test: Puede crear un artículo con referencias
     */
    public function test_puede_crear_articulo(): void
    {
        Storage::fake('public');
        
        $referencias = Referencia::factory()->count(2)->create();
        $foto = UploadedFile::fake()->image('articulo.jpg');

        $data = [
            'definicion' => 'Nuevo Articulo Test',
            'descripcionEspecifica' => 'Esta es una descripcion de prueba para el test',
            'peso' => 15.5,
            'comentarios' => 'Comentario de prueba',
            'referencias_ids' => $referencias->pluck('id')->toArray(),
            'fotoDescriptiva' => $foto
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/articulos', $data);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('articulos', [
            'definicion' => 'Nuevo Articulo Test',
            'peso' => 15.5
        ]);

        $articulo = Articulo::where('definicion', 'Nuevo Articulo Test')->first();
        $this->assertCount(2, $articulo->referencias);
    }

    /**
     * Test: Puede actualizar un artículo
     */
    public function test_puede_actualizar_articulo(): void
    {
        $articulo = Articulo::factory()->create([
            'definicion' => 'Articulo Original',
            'peso' => 10.0
        ]);
        $referencia = Referencia::factory()->create();

        $data = [
            'definicion' => 'Articulo Actualizado',
            'peso' => 20.0,
            'descripcionEspecifica' => 'Nueva descripcion',
            'referencias_ids' => [$referencia->id]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/v1/articulos/{$articulo->id}", $data);

        $response->assertStatus(200);
        
        $articulo->refresh();
        $this->assertEquals('Articulo Actualizado', $articulo->definicion);
        $this->assertEquals(20.0, (float)$articulo->peso);
    }

    /**
     * Test: Validacion al crear articulo
     */
    public function test_crear_articulo_validación_falla(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/articulos', [
                'definicion' => '', // Requerido
                'descripcionEspecifica' => '' // Requerido
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['definicion', 'descripcionEspecifica']);
    }
}
