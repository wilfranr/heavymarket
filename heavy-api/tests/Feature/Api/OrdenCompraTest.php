<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\Referencia;
use App\Models\Tercero;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['super_admin', 'Administrador'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
    $this->user = createUserWithRole('Administrador');
});

it('permite listar órdenes de compra', function () {
    OrdenCompra::factory()->count(3)->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/ordenes-compra');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

it('permite crear una orden de compra con referencias', function () {
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor']);
    $referencia = Referencia::factory()->create();

    $data = [
        'proveedor_id' => $proveedor->id,
        'fecha_expedicion' => now()->toDateString(),
        'fecha_entrega' => now()->addDays(5)->toDateString(),
        'estado' => OrdenCompraEstado::Generada->value,
        'referencias' => [
            [
                'referencia_id' => $referencia->id,
                'cantidad' => 2,
                'valor_unitario' => 100,
                'valor_total' => 200,
            ],
        ],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/ordenes-compra', $data);

    $response->assertStatus(201)
        ->assertJsonPath('data.valor_total', '200.00');

    $this->assertDatabaseHas('orden_compras', [
        'proveedor_id' => $proveedor->id,
        'valor_total' => 200,
    ]);

    $this->assertDatabaseHas('orden_compra_referencia', [
        'referencia_id' => $referencia->id,
        'cantidad' => 2,
    ]);
});

it('permite actualizar una orden de compra y sus referencias', function () {
    $orden = OrdenCompra::factory()->create(['valor_total' => 100]);
    $referencia = Referencia::factory()->create();
    $orden->addReferencia($referencia->id, 1, 100, 100);

    $nuevaReferencia = Referencia::factory()->create();

    $data = [
        'estado' => OrdenCompraEstado::Confirmada->value,
        'referencias' => [
            [
                'referencia_id' => $nuevaReferencia->id,
                'cantidad' => 5,
                'valor_unitario' => 50,
                'valor_total' => 250,
            ],
        ],
    ];

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/ordenes-compra/{$orden->id}", $data);

    $response->assertStatus(200)
        ->assertJsonPath('data.estado', OrdenCompraEstado::Confirmada->value)
        ->assertJsonPath('data.valor_total', '250.00');

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'valor_total' => 250,
    ]);

    // La referencia anterior debería haber sido eliminada
    $this->assertDatabaseMissing('orden_compra_referencia', [
        'orden_compra_id' => $orden->id,
        'referencia_id' => $referencia->id,
    ]);

    $this->assertDatabaseHas('orden_compra_referencia', [
        'orden_compra_id' => $orden->id,
        'referencia_id' => $nuevaReferencia->id,
        'cantidad' => 5,
    ]);
});

it('permite eliminar una orden de compra', function () {
    $orden = OrdenCompra::factory()->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->deleteJson("/v1/ordenes-compra/{$orden->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('orden_compras', ['id' => $orden->id]);
});
