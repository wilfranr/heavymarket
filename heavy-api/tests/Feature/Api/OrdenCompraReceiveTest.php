<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->admin = createUserWithRole('Administrador');
});

it('rechaza la recepción directa desde la orden de compra', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);
    $referencia = Referencia::factory()->create();
    OrdenCompraReferencia::create([
        'orden_compra_id' => $orden->id,
        'referencia_id' => $referencia->id,
        'cantidad' => 5,
        'valor_unitario' => 100,
        'valor_total' => 500,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$orden->id}/receive", [
            'referencias' => [
                [
                    'referencia_id' => $referencia->id,
                    'cantidad_recibida' => 2,
                ],
            ],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('recepcion');
});
