<?php

use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor', 'Analista'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->vendedor = createUserWithRole('Vendedor');
    $this->logistica = createUserWithRole('Logistica');
    $this->analista = createUserWithRole('Analista');
});

it('permite al Vendedor depurar un faltante dentro del saldo pendiente', function () {
    $referencia = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 6);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->patchJson("/v1/ordenes-trabajo/{$referencia->orden_trabajo_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => 4,
            'motivo_depuracion' => 'Proveedor no puede reponer la pieza dañada',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.cantidad_depurada', 4)
        ->assertJsonPath('data.motivo_depuracion', 'Proveedor no puede reponer la pieza dañada');

    $referencia->refresh();

    expect($referencia->cantidad_depurada)->toBe(4)
        ->and($referencia->depurado_por)->toBe($this->vendedor->id)
        ->and($referencia->depurado_at)->not->toBeNull();
});

it('acumula depuraciones sucesivas sobre la misma línea', function () {
    $referencia = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 0);

    depurar($this, $this->vendedor, $referencia, 3, 'Primer lote dañado');
    depurar($this, $this->vendedor, $referencia, 2, 'Segundo lote dañado');

    expect($referencia->fresh()->cantidad_depurada)->toBe(5);
});

it('rechaza depurar más de lo que queda pendiente en la línea', function () {
    $referencia = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 6);

    $response = depurar($this, $this->vendedor, $referencia, 5, 'Excede el saldo pendiente');

    $response->assertStatus(422)
        ->assertJsonValidationErrors('cantidad_depurada');

    expect($referencia->fresh()->cantidad_depurada)->toBe(0);
});

it('exige motivo de depuracion', function () {
    $referencia = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 0);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->patchJson("/v1/ordenes-trabajo/{$referencia->orden_trabajo_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => 1,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('motivo_depuracion');
});

it('restringe la depuracion a Vendedor, Administrador o super_admin', function () {
    $referencia = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 0);

    $response = depurar($this, $this->logistica, $referencia, 1, 'Intento no autorizado');

    $response->assertForbidden();

    $response = depurar($this, $this->analista, $referencia, 1, 'Intento no autorizado');

    $response->assertForbidden();
});

it('rechaza depurar un item que no pertenece a la orden de trabajo indicada', function () {
    $referenciaA = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 0);
    $referenciaB = crearReferenciaOt(cantidadCotizada: 10, cantidadRecibida: 0);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->patchJson("/v1/ordenes-trabajo/{$referenciaA->orden_trabajo_id}/referencias/{$referenciaB->id}/depurar", [
            'cantidad_depurada' => 1,
            'motivo_depuracion' => 'Cruce indebido de OT',
        ]);

    $response->assertNotFound();
});

function crearReferenciaOt(int $cantidadCotizada, int $cantidadRecibida): OrdenTrabajoReferencia
{
    $pedido = Pedido::factory()->create();

    $ordenTrabajo = OrdenTrabajo::factory()->create([
        'pedido_id' => $pedido->id,
        'cotizacion_id' => null,
        'estado' => 'En Proceso',
    ]);

    $pedidoReferencia = PedidoReferencia::factory()->create([
        'pedido_id' => $pedido->id,
        'cantidad' => $cantidadCotizada,
    ]);

    return OrdenTrabajoReferencia::factory()->create([
        'orden_trabajo_id' => $ordenTrabajo->id,
        'pedido_referencia_id' => $pedidoReferencia->id,
        'cantidad_cotizada' => $cantidadCotizada,
        'cantidad_recibida' => $cantidadRecibida,
        'cantidad_depurada' => 0,
        'estado' => 'Pendiente',
        'recibido' => false,
    ]);
}

function depurar(mixed $test, mixed $usuario, OrdenTrabajoReferencia $referencia, int $cantidad, string $motivo)
{
    return $test->actingAs($usuario, 'sanctum')
        ->patchJson("/v1/ordenes-trabajo/{$referencia->orden_trabajo_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => $cantidad,
            'motivo_depuracion' => $motivo,
        ]);
}
