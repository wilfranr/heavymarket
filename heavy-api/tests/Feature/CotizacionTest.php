<?php

namespace Tests\Feature;

use App\Models\Articulo;
use App\Models\City;
use App\Models\Contacto;
use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\Country;
use App\Models\Lista;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\Referencia;
use App\Models\State;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CotizacionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureDatabaseIsReady();
    }

    /**
     * Repara la base de datos de tests (SQLite in-memory) si le faltan tablas o columnas
     */
    private function ensureDatabaseIsReady()
    {
        // 1. Crear tablas de localización si faltan
        $tables = ['countries', 'states', 'cities'];
        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                Schema::create($table, function ($t) use ($table) {
                    $t->id();
                    $t->string('name');
                    if ($table === 'countries') {
                        $t->string('code')->nullable();
                    }
                    if ($table === 'states') {
                        $t->foreignId('country_id');
                    }
                    if ($table === 'cities') {
                        $t->foreignId('state_id');
                        $t->foreignId('country_id');
                        $t->softDeletes();
                    }
                    $t->timestamps();
                });
            }
        }

        // 2. Reparar tabla pedido_referencia_proveedor si le falta marca_id
        if (Schema::hasTable('pedido_referencia_proveedor') && ! Schema::hasColumn('pedido_referencia_proveedor', 'marca_id')) {
            Schema::table('pedido_referencia_proveedor', function ($t) {
                $t->unsignedBigInteger('marca_id')->after('proveedor_id')->nullable();
            });
        }

        // 3. Reparar tabla cotizacion_referencia_proveedores si le falta mostrar_referencia
        if (Schema::hasTable('cotizacion_referencia_proveedores') && ! Schema::hasColumn('cotizacion_referencia_proveedores', 'mostrar_referencia')) {
            Schema::table('cotizacion_referencia_proveedores', function ($t) {
                $t->boolean('mostrar_referencia')->default(true)->after('pedido_referencia_proveedor_id');
            });
        }
    }

    private function createFullData()
    {
        $user = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
        ]);

        $country = Country::create(['name' => 'Colombia', 'code' => 'CO']);
        $state = State::create(['name' => 'Cundinamarca', 'country_id' => $country->id]);
        $city = City::create(['name' => 'BOGOTA', 'state_id' => $state->id, 'country_id' => $country->id]);

        $tercero = Tercero::create([
            'nombre' => 'CLIENTE TEST',
            'numero_documento' => '12345678',
            'city_id' => $city->id,
            'estado' => 'Activo',
        ]);

        $contacto = Contacto::create([
            'tercero_id' => $tercero->id,
            'nombre' => 'CONTACTO TEST',
            'email' => 'contacto@test.com',
        ]);

        $maquina = Maquina::create([
            'modelo' => '120G',
            'serie' => '87V05667',
            'estado_revision' => 'revisado',
        ]);

        $pedido = Pedido::create([
            'tercero_id' => $tercero->id,
            'maquina_id' => $maquina->id,
            'user_id' => $user->id,
            'contacto_id' => $contacto->id,
            'estado' => 'En_Analisis',
        ]);

        $articulo = Articulo::create(['definicion' => 'REPUESTO TEST']);
        $referencia = Referencia::create(['articulo_id' => $articulo->id, 'referencia' => 'REF-TEST-'.uniqid()]);

        $pedidoReferencia = PedidoReferencia::create([
            'pedido_id' => $pedido->id,
            'referencia_id' => $referencia->id,
            'cantidad' => 1,
            'estado' => 'Activo',
        ]);

        $marca = Lista::create(['tipo' => 'Marcas', 'nombre' => 'CATERPILLAR']);

        $prp = PedidoReferenciaProveedor::create([
            'pedido_referencia_id' => $pedidoReferencia->id,
            'referencia_id' => $referencia->id,
            'proveedor_id' => $tercero->id,
            'marca_id' => $marca->id,
            'cantidad' => 1,
            'costo_unidad' => 100,
            'utilidad' => 10,
            'dias_entrega' => 5,
            'valor_total' => 100,
            'estado' => 'Seleccionado',
        ]);

        return compact('user', 'pedido', 'prp', 'tercero', 'city', 'marca', 'articulo');
    }

    public function test_can_finalize_costing_and_create_quotation_successfully(): void
    {
        $data = $this->createFullData();

        $response = $this->actingAs($data['user'])
            ->postJson('/v1/cotizaciones/finalizar-costeo', [
                'pedido_id' => $data['pedido']->id,
                'items' => [
                    ['id' => $data['prp']->id, 'mostrar_referencia' => false],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('cotizacion_referencia_proveedores', [
            'pedido_referencia_proveedor_id' => $data['prp']->id,
            'mostrar_referencia' => false,
        ]);

        $this->assertDatabaseHas('cotizaciones', [
            'pedido_id' => $data['pedido']->id,
        ]);

        $this->assertDatabaseHas('pedidos', [
            'id' => $data['pedido']->id,
            'estado' => 'Cotizado',
        ]);
    }

    public function test_quotation_relations_for_pdf_are_correctly_defined(): void
    {
        $data = $this->createFullData();

        $cotizacion = Cotizacion::create([
            'pedido_id' => $data['pedido']->id,
            'tercero_id' => $data['tercero']->id,
            'user_id' => $data['user']->id,
            'estado' => 'Enviada',
        ]);

        CotizacionReferenciaProveedor::create([
            'cotizacion_id' => $cotizacion->id,
            'pedido_referencia_proveedor_id' => $data['prp']->id,
        ]);

        $cotizacion->load([
            'pedido.tercero.city',
            'pedido.contacto',
            'pedido.maquina',
            'user',
            'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.marca',
        ]);

        $this->assertNotNull($cotizacion->tercero->city, 'Relación city falló');
        $this->assertNotNull($cotizacion->referenciasProveedores->first()->pedidoReferenciaProveedor->marca, 'Relación marca falló');
        $this->assertEquals('CATERPILLAR', strtoupper($cotizacion->referenciasProveedores->first()->pedidoReferenciaProveedor->marca->nombre));
    }
}
