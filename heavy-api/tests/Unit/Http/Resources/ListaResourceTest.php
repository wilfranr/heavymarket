<?php

declare(strict_types=1);

namespace Tests\Unit\Http\Resources;

use App\Http\Resources\ListaResource;
use App\Models\Fabricante;
use App\Models\Lista;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * ListaResource debe exponer `fabricante` cuando la relación está cargada (p. ej. listas tipo Fabricantes).
 *
 * Valida el contrato JSON del recurso sin levantar tablas (las migraciones actuales no crean `listas` en SQLite :memory:).
 */
class ListaResourceTest extends TestCase
{
    #[Test]
    public function incluye_fabricante_cuando_la_relacion_esta_cargada(): void
    {
        $fabricante = new Fabricante;
        $fabricante->forceFill([
            'id' => 42,
            'nombre' => 'Marca desde fabricantes',
            'descripcion' => 'Texto de apoyo',
            'logo' => null,
        ]);
        $fabricante->syncOriginal();

        $lista = Lista::make([
            'tipo' => 'Fabricantes',
            'nombre' => 'Marca desde fabricantes',
            'definicion' => 'Texto de apoyo',
            'foto' => null,
            'fotoMedida' => null,
            'sistema_id' => null,
            'parent_id' => null,
            'fabricante_id' => 42,
        ]);
        $lista->id = 1001;
        $lista->syncOriginal();
        $lista->setRelation('fabricante', $fabricante);

        $request = Request::create('/api/v1/listas', 'GET');
        $array = (new ListaResource($lista))->resolve($request);

        $this->assertArrayHasKey('fabricante', $array);
        $this->assertIsArray($array['fabricante']);
        $this->assertSame(42, $array['fabricante']['id']);
        $this->assertSame('Marca desde fabricantes', $array['fabricante']['nombre']);
        $this->assertSame(42, $array['fabricante_id']);
    }

    #[Test]
    public function no_incluye_fabricante_si_la_relacion_no_esta_cargada(): void
    {
        $lista = Lista::make([
            'tipo' => 'Marca',
            'nombre' => 'Solo marca',
            'definicion' => null,
            'foto' => null,
            'fotoMedida' => null,
            'sistema_id' => null,
            'parent_id' => null,
            'fabricante_id' => null,
        ]);
        $lista->id = 2002;
        $lista->syncOriginal();

        $lista->unsetRelation('fabricante');

        $request = Request::create('/api/v1/listas', 'GET');
        $array = (new ListaResource($lista))->resolve($request);

        $this->assertArrayNotHasKey('fabricante', $array);
    }
}
