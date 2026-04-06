<?php

declare(strict_types=1);

namespace Tests\Unit\Http\Resources;

use App\Http\Resources\MaquinaResource;
use App\Models\{Maquina, Lista};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MaquinaResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: MaquinaResource incluye todos los campos requeridos
     */
    public function test_maquina_resource_incluye_campos_requeridos(): void
    {
        // Arrange: crear máquina con relaciones
        $tipo = Lista::factory()->tipoMaquina()->create();
        $fabricante = Lista::factory()->fabricante()->create();
        
        $maquina = Maquina::factory()->create([
            'tipo' => $tipo->id,
            'fabricante_id' => $fabricante->id,
        ]);

        $maquina->load(['fabricante', 'listas']);

        // Act: transformar con resource
        $resource = new MaquinaResource($maquina);
        $array = $resource->toArray(new Request());

        // Assert: verificar campos
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('tipo', $array);
        $this->assertArrayHasKey('modelo', $array);
        $this->assertArrayHasKey('fabricante_id', $array);
        $this->assertArrayHasKey('serie', $array);
        $this->assertArrayHasKey('arreglo', $array);
        $this->assertArrayHasKey('estado_revision', $array);
        $this->assertArrayHasKey('created_at', $array);
        $this->assertArrayHasKey('updated_at', $array);
    }

    /**
     * Test: MaquinaResource incluye estado_revision con valor correcto
     */
    public function test_maquina_resource_incluye_estado_revision(): void
    {
        // Arrange: máquina con estado revisada
        $tipo = Lista::factory()->tipoMaquina()->create();
        $fabricante = Lista::factory()->fabricante()->create();
        
        $maquina = Maquina::factory()->revisada()->create([
            'tipo' => $tipo->id,
            'fabricante_id' => $fabricante->id,
        ]);

        // Act
        $resource = new MaquinaResource($maquina);
        $array = $resource->toArray(new Request());

        // Assert
        $this->assertEquals('revisado', $array['estado_revision']);
    }

    /**
     * Test: MaquinaResource incluye relaciones cuando están cargadas
     */
    public function test_maquina_resource_incluye_relaciones_cuando_se_cargan(): void
    {
        // Arrange
        $tipo = Lista::factory()->tipoMaquina()->create();
        $fabricante = Lista::factory()->fabricante()->create();
        
        $maquina = Maquina::factory()->create([
            'tipo' => $tipo->id,
            'fabricante_id' => $fabricante->id,
        ]);

        $maquina->load(['fabricante', 'listas']);

        // Act
        $resource = new MaquinaResource($maquina);
        $array = $resource->toArray(new Request());

        // Assert
        $this->assertArrayHasKey('fabricante', $array);
        $this->assertArrayHasKey('tipoLista', $array);
    }

    /**
     * Test: MaquinaResource no incluye relaciones si no están cargadas
     */
    public function test_maquina_resource_no_incluye_relaciones_sin_cargar(): void
    {
        // Arrange
        $tipo = Lista::factory()->tipoMaquina()->create();
        $fabricante = Lista::factory()->fabricante()->create();
        
        $maquina = Maquina::factory()->create([
            'tipo' => $tipo->id,
            'fabricante_id' => $fabricante->id,
        ]);

        // Act (sin load)
        $resource = new MaquinaResource($maquina);
        $array = $resource->toArray(new Request());

        // Assert - no debe incluir fabricante ni tipoLista
        $this->assertArrayNotHasKey('fabricante', $array);
        $this->assertArrayNotHasKey('tipoLista', $array);
    }
}
