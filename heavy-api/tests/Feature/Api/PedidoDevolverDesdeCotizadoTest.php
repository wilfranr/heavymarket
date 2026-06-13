<?php

/**
 * Tests de devoluciones desde estado Cotizado
 *
 * Valida los endpoints:
 * - POST /pedidos/{id}/devolver-a-costeo
 * - POST /pedidos/{id}/devolver-analista (desde Cotizado)
 */

use App\Models\Cotizacion;
use App\Models\Pedido;
use App\Models\Tercero;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    seedPermissions();
    Notification::fake();

    $this->vendedor = createUserWithRole('Vendedor');
    $this->admin = createUserWithRole('Administrador');
    $this->tercero = Tercero::factory()->create(['tipo' => 'Cliente']);
});

// === Devolver a Costeo ===

it('devuelve pedido de Cotizado a En_Costeo con comentario obligatorio', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'Necesito ajustar precios de proveedores',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'En_Costeo')
        ->assertJsonPath('message', 'Pedido devuelto a costeo');

    expect($pedido->fresh()->estado)->toBe('En_Costeo');
});

it('rechaza devolver a costeo sin comentario', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", []);

    $response->assertUnprocessable();
});

it('rechaza devolver a costeo con comentario muy corto', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'corto',
        ]);

    $response->assertUnprocessable();
});

it('rechaza devolver a costeo si el pedido no esta Cotizado', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'Intento invalido',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Solo los pedidos en estado Cotizado pueden devolverse a costeo.');
});

it('anula cotizacion activa al devolver a costeo', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
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
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'Cliente pidio ajuste de precios',
        ]);

    $response->assertOk();

    expect($cotizacion->fresh()->estado)->toBe('Anulada');
    expect($pedido->fresh()->estado)->toBe('En_Costeo');
});

it('admin puede devolver a costeo', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'Ajuste administrativo de precios',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'En_Costeo');
});

// === Devolver a Analista desde Cotizado ===

it('devuelve pedido de Cotizado a En_Analisis', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-analista", [
            'comentario' => 'Falta una referencia en la cotizacion',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'En_Analisis')
        ->assertJsonPath('message', 'Pedido devuelto al analista');

    expect($pedido->fresh()->estado)->toBe('En_Analisis');
});

it('anula cotizacion activa al devolver a analista desde Cotizado', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $cotizacion = Cotizacion::create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
        'estado' => 'Borrador',
        'fecha_emision' => now(),
        'fecha_vencimiento' => now()->addDays(15),
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-analista", [
            'comentario' => 'Cliente necesita referencia adicional',
        ]);

    $response->assertOk();

    expect($cotizacion->fresh()->estado)->toBe('Anulada');
    expect($pedido->fresh()->estado)->toBe('En_Analisis');
});

it('rechaza devolver a analista desde estado no permitido', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Nuevo',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-analista", [
            'comentario' => 'Intento invalido',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Solo los pedidos en estado Cotizado o En_Costeo pueden devolverse al analista.');
});

it('devolver a analista desde En_Costeo sigue funcionando sin anular cotizacion', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'En_Costeo',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
    ]);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-analista", [
            'comentario' => 'Necesito que el analista revise las referencias',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', 'En_Analisis');

    expect($pedido->fresh()->estado)->toBe('En_Analisis');
});

it('registra comentario estructurado al devolver a costeo', function () {
    $pedido = Pedido::factory()->create([
        'estado' => 'Cotizado',
        'tercero_id' => $this->tercero->id,
        'user_id' => $this->vendedor->id,
        'comentario' => [],
    ]);

    $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/devolver-a-costeo", [
            'comentario' => 'Ajuste de precios solicitado por cliente',
        ]);

    $comentarios = $pedido->fresh()->comentario;

    expect($comentarios)->toBeArray()
        ->toHaveCount(1)
        ->and($comentarios[0]['origen'])->toBe('Asesor')
        ->and($comentarios[0]['comentario'])->toBe('Ajuste de precios solicitado por cliente')
        ->and($comentarios[0]['tipo'])->toBe('devolucion_costeo_desde_cotizado');
});
