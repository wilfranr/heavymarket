<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Asesor', 'Vendedor', 'Gerente Comercial'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->asesor = createUserWithRole('Vendedor');
    $this->admin = createUserWithRole('Administrador');
});

function crearOCConReferencia(int $cantidad, OrdenCompraEstado $estado): array
{
    $ordenCompra = OrdenCompra::factory()->create([
        'estado' => $estado->value,
        'color' => $estado->color(),
    ]);
    $referencia = Referencia::factory()->create();
    $detalle = OrdenCompraReferencia::create([
        'orden_compra_id' => $ordenCompra->id,
        'referencia_id' => $referencia->id,
        'cantidad' => $cantidad,
        'valor_unitario' => 150,
        'valor_total' => $cantidad * 150,
    ]);

    return [$ordenCompra, $detalle];
}

it('bloquea la orden de compra a Recepción con Novedades cuando hay unidades rechazadas', function () {
    [$orden, $detalle] = crearOCConReferencia(10, OrdenCompraEstado::EnTransito);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$orden->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'numero_remision' => 'REM-NOV-1',
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 10,
                    'cantidad_conforme' => 8,
                    'cantidad_rechazada' => 2,
                    'motivo_rechazo' => 'Pieza golpeada y rota durante el transporte',
                ],
            ],
        ]);

    $response->assertCreated();

    $orden->refresh();
    expect($orden->estado)->toBe(OrdenCompraEstado::RecepcionConNovedades->value);
    expect($orden->color)->toBe(OrdenCompraEstado::RecepcionConNovedades->color());
});

it('cierra la orden a Entregada / Cerrada cuando la recepcion es 100% conforme sin rechazos', function () {
    [$orden, $detalle] = crearOCConReferencia(10, OrdenCompraEstado::EnTransito);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$orden->id}/recepciones", [
            'fecha_recepcion' => now()->toISOString(),
            'numero_remision' => 'REM-OK-1',
            'detalles' => [
                [
                    'orden_compra_detalle_id' => $detalle->id,
                    'cantidad_recibida' => 10,
                    'cantidad_conforme' => 10,
                    'cantidad_rechazada' => 0,
                ],
            ],
        ]);

    $response->assertCreated();

    $orden->refresh();
    expect($orden->estado)->toBe(OrdenCompraEstado::EntregadaCerrada->value);
    expect($orden->color)->toBe(OrdenCompraEstado::EntregadaCerrada->color());
    expect($orden->fecha_recepcion)->not->toBeNull();
});

it('permite al asesor resolver la novedad aprobando reposicion', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::RecepcionConNovedades->value,
        'color' => OrdenCompraEstado::RecepcionConNovedades->color(),
    ]);

    // Rechaza si falta comentario obligatorio
    $fail = $this->actingAs($this->asesor, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PagadaListaDespacho->value,
            'resolucion_novedad_tipo' => 'reposicion',
        ]);

    $fail->assertStatus(422)
        ->assertJsonValidationErrors('resolucion_novedad_comentario');

    // Con comentario pasa exitosamente
    $ok = $this->actingAs($this->asesor, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PagadaListaDespacho->value,
            'resolucion_novedad_tipo' => 'reposicion',
            'resolucion_novedad_comentario' => 'El proveedor acordó despachar 2 unidades de reemplazo mañana.',
        ]);

    $ok->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::PagadaListaDespacho->value)
        ->assertJsonPath('data.resolucion_novedad_tipo', 'reposicion')
        ->assertJsonPath('data.resolucion_novedad_comentario', 'El proveedor acordó despachar 2 unidades de reemplazo mañana.');

    $orden->refresh();
    expect($orden->estado)->toBe(OrdenCompraEstado::PagadaListaDespacho->value);
    expect($orden->resolucion_novedad_tipo)->toBe('reposicion');
    expect($orden->resolucion_novedad_comentario)->toBe('El proveedor acordó despachar 2 unidades de reemplazo mañana.');
    expect($orden->resuelto_por_id)->toBe($this->asesor->id);
    expect($orden->fecha_resolucion_novedad)->not->toBeNull();
});

it('permite resolver la novedad solicitando nota credito / reembolso cerrando la orden', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::RecepcionConNovedades->value,
        'color' => OrdenCompraEstado::RecepcionConNovedades->color(),
    ]);

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::EntregadaCerrada->value,
            'resolucion_novedad_tipo' => 'nota_credito',
            'resolucion_novedad_comentario' => 'Se acordó descuento en la siguiente factura comercial por las 2 piezas rotas.',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::EntregadaCerrada->value)
        ->assertJsonPath('data.resolucion_novedad_tipo', 'nota_credito');

    $orden->refresh();
    expect($orden->estado)->toBe(OrdenCompraEstado::EntregadaCerrada->value);
    expect($orden->resolucion_novedad_tipo)->toBe('nota_credito');
    expect($orden->resuelto_por_id)->toBe($this->admin->id);
    expect($orden->fecha_resolucion_novedad)->not->toBeNull();
});
