<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->vendedor = createUserWithRole('Vendedor');
});

function crearOrdenCompraConDetalleParaEndpoint(int $cantidadOrdenada, OrdenCompraEstado $estado): array
{
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => $estado->value,
        'color' => $estado->color(),
    ]);
    $referencia = Referencia::factory()->create();
    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidadOrdenada,
        'valor_unitario' => 100,
        'valor_total' => $cantidadOrdenada * 100,
    ]);

    return [$ordenCompra, $detalle];
}

it('registra una recepción vía POST y devuelve 201 con el resource completo', function () {
    [$ordenCompra, $detalle] = crearOrdenCompraConDetalleParaEndpoint(10, OrdenCompraEstado::Despachada);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'numero_remision' => 'REM-500',
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 6,
                    'cantidad_conforme' => 6,
                    'cantidad_rechazada' => 0,
                ],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.orden_trabajo_id', null)
        ->assertJsonPath('data.orden_compra_id', $ordenCompra->id)
        ->assertJsonPath('data.detalles.0.cantidad_conforme', 6);
});

it('rechaza el registro sin permisos con 403', function () {
    [$ordenCompra, $detalle] = crearOrdenCompraConDetalleParaEndpoint(10, OrdenCompraEstado::Despachada);

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 1, 'cantidad_conforme' => 1, 'cantidad_rechazada' => 0],
            ],
        ]);

    $response->assertForbidden();
});

it('devuelve 404 si la orden de compra no existe', function () {
    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson('/v1/ordenes-compra/999999/recepciones', [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                ['orden_compra_detalle_id' => 1, 'cantidad_recibida' => 1, 'cantidad_conforme' => 1, 'cantidad_rechazada' => 0],
            ],
        ]);

    $response->assertNotFound();
});

it('devuelve 422 cuando la cantidad recibida no coincide con conforme+rechazada', function () {
    [$ordenCompra, $detalle] = crearOrdenCompraConDetalleParaEndpoint(10, OrdenCompraEstado::Despachada);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 5, 'cantidad_conforme' => 2, 'cantidad_rechazada' => 2],
            ],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('detalles.0.cantidad_recibida');
});

it('lista el historial de entregas de una orden de compra', function () {
    [$ordenCompra, $detalle] = crearOrdenCompraConDetalleParaEndpoint(10, OrdenCompraEstado::Despachada);

    $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'detalles' => [
                ['orden_compra_detalle_id' => $detalle->id, 'cantidad_recibida' => 4, 'cantidad_conforme' => 4, 'cantidad_rechazada' => 0],
            ],
        ])->assertCreated();

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->getJson("/v1/ordenes-compra/{$ordenCompra->id}/recepciones");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.detalles.0.cantidad_conforme', 4);
});
