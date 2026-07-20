<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\Tercero;
use App\Models\Transportadora;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Proveedor', 'guard_name' => 'web']);

    $this->providerUser = createUserWithRole('Proveedor');
    $this->proveedor = Tercero::factory()->create([
        'tipo' => 'Proveedor',
        'user_id' => $this->providerUser->id,
        'provider_access' => true,
    ]);
});

it('permite al proveedor confirmar una orden enviada', function () {
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::Enviada->value,
        'color' => OrdenCompraEstado::Enviada->color(),
    ]);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->postJson("/v1/provider/purchase-orders/{$orden->id}/confirm", [
            'observaciones' => 'Aceptamos la orden.',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Confirmada->value);

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::Confirmada->value,
    ]);
});

it('registra despacho sin escribir estado legacy despachado', function () {
    $transportadora = Transportadora::factory()->create();
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->putJson("/v1/provider/purchase-orders/{$orden->id}/dispatch", [
            'guia' => 'GUIA-123',
            'transportadora_id' => $transportadora->id,
            'fecha_despacho' => now()->toDateString(),
            'observaciones' => 'Despachado por transportadora.',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Confirmada->value)
        ->assertJsonPath('data.guia', 'GUIA-123');

    $this->assertDatabaseMissing('orden_compras', [
        'id' => $orden->id,
        'estado' => 'Despachado',
    ]);
});
