<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Logistica', 'Analista'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->analista = createUserWithRole('Analista');
});

it('permite a Logistica depurar un faltante cuando la OC esta Demorada', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 6, estadoOc: OrdenCompraEstado::Demorado);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$referencia->orden_compra_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => 4,
            'motivo_depuracion' => 'Proveedor confirmo que la mercancia se perdio en transito',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.cantidad_depurada', 4)
        ->assertJsonPath('data.motivo_depuracion', 'Proveedor confirmo que la mercancia se perdio en transito')
        ->assertJsonPath('data.saldo_pendiente', 0);

    $referencia->refresh();

    expect($referencia->cantidad_depurada)->toBe(4)
        ->and($referencia->depurado_por)->toBe($this->logistica->id)
        ->and($referencia->depurado_at)->not->toBeNull();
});

it('rechaza depurar si la OC no esta en estado Demorado', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::EnTransito);

    $response = depurarOc($this, $this->logistica, $referencia, 3, 'Intento fuera de estado');

    $response->assertStatus(422)
        ->assertJsonValidationErrors('orden_compra');

    expect($referencia->fresh()->cantidad_depurada)->toBe(0);
});

it('rechaza depurar mas de lo que queda pendiente en la linea', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 6, estadoOc: OrdenCompraEstado::Demorado);

    $response = depurarOc($this, $this->logistica, $referencia, 5, 'Excede el saldo pendiente');

    $response->assertStatus(422)
        ->assertJsonValidationErrors('cantidad_depurada');

    expect($referencia->fresh()->cantidad_depurada)->toBe(0);
});

it('acumula depuraciones sucesivas sobre la misma linea', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::Demorado);

    depurarOc($this, $this->logistica, $referencia, 3, 'Primer lote perdido');
    depurarOc($this, $this->logistica, $referencia, 2, 'Segundo lote perdido');

    expect($referencia->fresh()->cantidad_depurada)->toBe(5);
});

it('exige motivo de depuracion', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::Demorado);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$referencia->orden_compra_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => 1,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('motivo_depuracion');
});

it('restringe la depuracion a super_admin, Administrador o Logistica', function () {
    $referencia = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::Demorado);

    $response = depurarOc($this, $this->analista, $referencia, 1, 'Intento no autorizado');

    $response->assertForbidden();
});

it('rechaza depurar un item que no pertenece a la orden de compra indicada', function () {
    $referenciaA = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::Demorado);
    $referenciaB = crearReferenciaOc(cantidad: 10, cantidadRecibida: 0, estadoOc: OrdenCompraEstado::Demorado);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$referenciaA->orden_compra_id}/referencias/{$referenciaB->id}/depurar", [
            'cantidad_depurada' => 1,
            'motivo_depuracion' => 'Cruce indebido de OC',
        ]);

    $response->assertNotFound();
});

function crearReferenciaOc(int $cantidad, int $cantidadRecibida, OrdenCompraEstado $estadoOc): OrdenCompraReferencia
{
    $orden = OrdenCompra::factory()->create([
        'estado' => $estadoOc->value,
        'color' => $estadoOc->color(),
    ]);

    $referencia = Referencia::factory()->create();

    return OrdenCompraReferencia::create([
        'orden_compra_id' => $orden->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidad,
        'cantidad_recibida' => $cantidadRecibida,
        'valor_unitario' => 1000,
        'valor_total' => 1000 * $cantidad,
    ]);
}

function depurarOc(mixed $test, mixed $usuario, OrdenCompraReferencia $referencia, int $cantidad, string $motivo)
{
    return $test->actingAs($usuario, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$referencia->orden_compra_id}/referencias/{$referencia->id}/depurar", [
            'cantidad_depurada' => $cantidad,
            'motivo_depuracion' => $motivo,
        ]);
}
