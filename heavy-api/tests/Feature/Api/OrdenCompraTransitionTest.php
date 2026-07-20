<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Logistica'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->admin = createUserWithRole('Administrador');
});

it('permite transicionar una orden enviada a confirmada', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Enviada->value,
        'color' => OrdenCompraEstado::Enviada->color(),
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Confirmada->value,
            'observaciones' => 'Confirmada por proveedor.',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Confirmada->value)
        ->assertJsonPath('data.color', OrdenCompraEstado::Confirmada->color());

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);

    expect($orden->fresh()->fecha_confirmacion)->not->toBeNull();
});

it('rechaza transiciones no permitidas', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::PendienteDeEnvio->value,
        'color' => OrdenCompraEstado::PendienteDeEnvio->color(),
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Recibida->value,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('estado_destino');
});

it('exige motivo para cancelar una orden enviada', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Enviada->value,
        'color' => OrdenCompraEstado::Enviada->color(),
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Cancelada->value,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('motivo_cancelacion');
});

it('exige aprobación admin para cancelar una orden confirmada', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Cancelada->value,
            'motivo_cancelacion' => 'Proveedor no puede cumplir.',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('aprobacion_admin');

    $ok = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Cancelada->value,
            'motivo_cancelacion' => 'Proveedor no puede cumplir.',
            'aprobacion_admin' => true,
        ]);

    $ok->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Cancelada->value);
});
