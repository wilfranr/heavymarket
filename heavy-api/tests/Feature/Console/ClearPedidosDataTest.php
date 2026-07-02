<?php

namespace Tests\Feature\Console;

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

class ClearPedidosDataTest extends TestCase
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

        if (Schema::hasTable('pedido_referencia_proveedor') && ! Schema::hasColumn('pedido_referencia_proveedor', 'marca_id')) {
            Schema::table('pedido_referencia_proveedor', function ($t) {
                $t->unsignedBigInteger('marca_id')->after('proveedor_id')->nullable();
            });
        }

        if (Schema::hasTable('cotizacion_referencia_proveedores') && ! Schema::hasColumn('cotizacion_referencia_proveedores', 'mostrar_referencia')) {
            Schema::table('cotizacion_referencia_proveedores', function ($t) {
                $t->boolean('mostrar_referencia')->default(true)->after('pedido_referencia_proveedor_id');
            });
        }
    }

    public function test_artisan_command_clears_only_pedidos_and_dependent_data(): void
    {
        // 1. Arrange: Crear datos de maestros y datos transaccionales (pedidos/cotizaciones)
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
        $referencia = Referencia::create(['articulo_id' => $articulo->id, 'referencia' => 'REF-TEST']);

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

        $cotizacion = Cotizacion::create([
            'pedido_id' => $pedido->id,
            'tercero_id' => $tercero->id,
            'user_id' => $user->id,
            'estado' => 'Enviada',
        ]);

        CotizacionReferenciaProveedor::create([
            'cotizacion_id' => $cotizacion->id,
            'pedido_referencia_proveedor_id' => $prp->id,
        ]);

        // Aseguramos que los registros existen en la BD antes de vaciar
        $this->assertDatabaseCount('pedidos', 1);
        $this->assertDatabaseCount('cotizaciones', 1);
        $this->assertDatabaseCount('pedido_referencia', 1);
        $this->assertDatabaseCount('pedido_referencia_proveedor', 1);
        $this->assertDatabaseCount('cotizacion_referencia_proveedores', 1);

        $this->assertDatabaseCount('terceros', 1);
        $this->assertDatabaseCount('articulos', 1);
        $this->assertDatabaseCount('maquinas', 1);
        $this->assertDatabaseCount('referencias', 1);
        $this->assertDatabaseCount('listas', 1);
        $this->assertDatabaseCount('users', 1);

        // 2. Act: Ejecutar el comando db:clear-pedidos-data con --force
        $this->artisan('db:clear-pedidos-data', ['--force' => true])
             ->expectsConfirmation('¿Estás COMPLETAMENTE SEGURO de que quieres continuar?', 'yes')
             ->assertExitCode(0);

        // 3. Assert: Verificar que las tablas de pedidos y dependencias se limpiaron
        $this->assertDatabaseCount('pedidos', 0);
        $this->assertDatabaseCount('cotizaciones', 0);
        $this->assertDatabaseCount('pedido_referencia', 0);
        $this->assertDatabaseCount('pedido_referencia_proveedor', 0);
        $this->assertDatabaseCount('cotizacion_referencia_proveedores', 0);

        // Verificar que las tablas de maestros siguen intactas
        $this->assertDatabaseCount('terceros', 1);
        $this->assertDatabaseCount('articulos', 1);
        $this->assertDatabaseCount('maquinas', 1);
        $this->assertDatabaseCount('referencias', 1);
        $this->assertDatabaseCount('listas', 1);
        $this->assertDatabaseCount('users', 1);
    }
}
