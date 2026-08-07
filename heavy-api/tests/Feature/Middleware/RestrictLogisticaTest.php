<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Logistica', 'guard_name' => 'web']);
    $this->logistica = createUserWithRole('Logistica');
});

it('permite a Logistica registrar y listar recepciones desde la orden de compra', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Despachada->value,
        'color' => OrdenCompraEstado::Despachada->color(),
    ]);
    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => Referencia::factory()->create()->id,
        'cantidad' => 10,
        'valor_unitario' => 100,
        'valor_total' => 1000,
    ]);

    $store = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 3, 'cantidad_conforme' => 3, 'cantidad_rechazada' => 0],
            ],
        ]);
    $store->assertCreated();

    $index = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones");
    $index->assertOk();
});

it('permite a Logistica listar y ver el detalle de una orden de compra (solo lectura)', function () {
    $ordenCompra = OrdenCompra::factory()->create();

    $show = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-compra/{$ordenCompra->id}");
    $show->assertOk();

    $index = $this->actingAs($this->logistica, 'sanctum')
        ->getJson('/v1/ordenes-compra');
    $index->assertOk();
});

it('bloquea a Logistica de editar o eliminar una orden de compra', function () {
    $ordenCompra = OrdenCompra::factory()->create();

    $update = $this->actingAs($this->logistica, 'sanctum')
        ->putJson("/v1/ordenes-compra/{$ordenCompra->id}", ['observaciones' => 'intento de edicion']);
    $update->assertForbidden();

    $delete = $this->actingAs($this->logistica, 'sanctum')
        ->deleteJson("/v1/ordenes-compra/{$ordenCompra->id}");
    $delete->assertForbidden();
});

it('bloquea a Logistica de transicionar el estado formal de una orden de compra', function () {
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Generada->value,
        'color' => OrdenCompraEstado::Generada->color(),
    ]);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$ordenCompra->id}/transition", ['estado_destino' => OrdenCompraEstado::Enviada->value]);

    $response->assertForbidden();
});
