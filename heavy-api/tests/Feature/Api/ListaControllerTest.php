<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Lista;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ListaControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $this->user = User::factory()->create();
        $this->user->assignRole('Administrador');
    }

    /**
     * Test: Puede crear una pieza estandar con fotoMedida
     */
    public function test_puede_crear_pieza_estandar_con_foto_medida(): void
    {
        Storage::fake('public');
        $fotoMedida = UploadedFile::fake()->image('plano.jpg');

        $data = [
            'tipo' => 'Piezas Estandar',
            'nombre' => 'Abrazadera Test',
            'definicion' => 'Definición de prueba',
            'fotoMedida' => $fotoMedida
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/v1/listas', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('listas', [
            'nombre' => 'Abrazadera Test',
            'tipo' => 'Piezas Estandar'
        ]);

        $lista = Lista::where('nombre', 'Abrazadera Test')->first();
        $this->assertNotNull($lista->fotoMedida);
        Storage::disk('public')->assertExists($lista->fotoMedida);
    }

    /**
     * Test: Puede actualizar una lista y el binding funciona
     */
    public function test_puede_actualizar_lista(): void
    {
        $lista = Lista::create([
            'tipo' => 'Marca',
            'nombre' => 'Marca Original',
            'definicion' => 'Original'
        ]);

        $data = [
            'nombre' => 'Marca Actualizada',
            'definicion' => 'Actualizada'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/v1/listas/{$lista->id}", $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('listas', [
            'id' => $lista->id,
            'nombre' => 'Marca Actualizada'
        ]);
    }
}
