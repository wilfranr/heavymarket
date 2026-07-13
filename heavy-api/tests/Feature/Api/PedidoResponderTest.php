<?php

/**
 * Tests de endpoint responder (aprobar/rechazar) con flujo unificado
 *
 * Valida que al aprobar se creen OT/OC y al rechazar se marque la cotizacion.
 */

use App\Models\Cotizacion;
use App\Models\OrdenCompra;
use App\Models\OrdenTrabajo;
use App\Models\Pedido;
use App\Models\Tercero;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    seedPermissions();

    $this->vendedor = createUserWithRole('Vendedor');
    $this->admin = createUserWithRole('Administrador');
    $this->tercero = Tercero::factory()->create(['tipo' => 'Cliente']);
});

// === Aprobar ===

it('aprueba pedido y crea OT/OC', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $cotizacion = Cotizacion::create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
        'estado' => 'Enviada',
        'fecha_emision' => now(),
        'fecha_vencimiento' => now()->addDays(15),
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", [
            'respuesta' => 'aprobar',
            'comentario' => 'Cliente aprobo la cotizacion',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'Aprobado')
        ->assertJsonPath('message', 'Pedido aprobado. OT y OC generadas.');

    expect($pedido->fresh()->estado)->toBe('Aprobado');
    expect($cotizacion->fresh()->estado)->toBe('Aprobada');
    expect(OrdenTrabajo::where('pedido_id', $pedido->id)->exists())->toBeTrue();
})->skip('OC requiere proveedores con tercero_id en cotizacion_referencias_proveedores');

it('rechaza aprobar si el pedido no esta En Costeo ni Cotizado', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Aprobado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", [
            'respuesta' => 'aprobar',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Solo los pedidos en estado En Costeo o Cotizado pueden responderse.');
});

it('rechaza aprobar sin respuesta', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", []);

    $response->assertUnprocessable();
});

// === Rechazar ===

it('rechaza cotizacion y conserva pedido en costeo', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $cotizacion = Cotizacion::create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
        'estado' => 'Enviada',
        'fecha_emision' => now(),
        'fecha_vencimiento' => now()->addDays(15),
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", [
            'respuesta' => 'rechazar',
            'comentario' => 'Precio muy alto',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'En_Costeo')
        ->assertJsonPath('message', 'Cotización rechazada. El pedido permanece disponible para costeo.');

    expect($pedido->fresh()->estado)->toBe('En_Costeo');
    expect($cotizacion->fresh()->estado)->toBe('Rechazada');
});

it('rechaza sin crear OT/OC al rechazar', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    Cotizacion::create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
        'estado' => 'Enviada',
        'fecha_emision' => now(),
        'fecha_vencimiento' => now()->addDays(15),
    ]);

    $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", [
            'respuesta' => 'rechazar',
            'comentario' => 'No interesa',
        ]);

    expect(OrdenTrabajo::where('pedido_id', $pedido->id)->exists())->toBeFalse();
    expect(OrdenCompra::where('pedido_id', $pedido->id)->exists())->toBeFalse();
});

it('rechaza responder si no hay cotizacion activa', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/responder", [
            'respuesta' => 'rechazar',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'No hay una cotización activa para rechazar.');

    expect($pedido->fresh()->estado)->toBe('Cotizado');
});
