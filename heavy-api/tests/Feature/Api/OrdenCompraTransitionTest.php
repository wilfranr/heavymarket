<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['super_admin', 'Administrador', 'Logistica', 'Gerente Comercial', 'Contabilidad', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->admin = createUserWithRole('Administrador');
});

it('permite transicionar una orden generada a revision de stock exigiendo instrucciones', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Generada->value,
        'color' => OrdenCompraEstado::Generada->color(),
    ]);

    // Falla sin instrucciones_despacho
    $fail = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PendienteRevisionStock->value,
        ]);

    $fail->assertStatus(422)
        ->assertJsonValidationErrors('instrucciones_despacho');

    // Pasa con instrucciones_despacho
    $ok = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PendienteRevisionStock->value,
            'instrucciones_despacho' => 'Entregar en bodega principal con empaque sellado.',
        ]);

    $ok->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::PendienteRevisionStock->value)
        ->assertJsonPath('data.instrucciones_despacho', 'Entregar en bodega principal con empaque sellado.');

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::PendienteRevisionStock->value,
        'instrucciones_despacho' => 'Entregar en bodega principal con empaque sellado.',
    ]);

    expect($orden->fresh()->fecha_envio)->not->toBeNull();
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
        'estado' => OrdenCompraEstado::Generada->value,
        'color' => OrdenCompraEstado::Generada->color(),
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

it('permite transicionar de confirmada a pagada y luego a despachada', function () {
    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Confirmada->value,
        'color' => OrdenCompraEstado::Confirmada->color(),
    ]);

    // De Confirmada a Pagada
    $responsePagada = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Pagada->value,
        ]);

    $responsePagada->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Pagada->value);

    // De Pagada a Despachada
    $responseDespachada = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::Despachada->value,
        ]);

    $responseDespachada->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::Despachada->value);

    expect($orden->fresh()->fecha_despacho)->not->toBeNull();
});

it('permite transicionar por el flujo formal completo del cliente', function () {
    $gerente = createUserWithRole('Gerente Comercial');
    $contabilidad = createUserWithRole('Contabilidad');

    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::PendienteRevisionStock->value,
        'color' => OrdenCompraEstado::PendienteRevisionStock->color(),
    ]);

    // 1. Stock Confirmado -> En Espera de Aprobación Gerencial
    $r1 = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::EnEsperaAprobacionGerencial->value,
        ]);
    $r1->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::EnEsperaAprobacionGerencial->value);

    // 2. Gerente Comercial aprueba -> Pendiente de Pago
    $r2 = $this->actingAs($gerente, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PendienteDePago->value,
        ]);
    $r2->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::PendienteDePago->value);
    expect($orden->fresh()->aprobado_por_gerente_id)->toBe($gerente->id);

    // 3. Contabilidad registra pago -> Pagada / Lista para Despacho
    $r3 = $this->actingAs($contabilidad, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PagadaListaDespacho->value,
            'referencia_pago' => 'TRANSF-9988',
            'comprobante_pago_ruta' => "ordenes-compra/{$orden->id}/comprobantes/test-soporte.pdf",
        ]);
    $r3->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::PagadaListaDespacho->value);
    expect($orden->fresh()->pagado_por_id)->toBe($contabilidad->id);
    expect($orden->fresh()->comprobante_pago_ruta)->toBe("ordenes-compra/{$orden->id}/comprobantes/test-soporte.pdf");

    // 4. Proveedor despacha -> En Tránsito
    $r4 = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::EnTransito->value,
        ]);
    $r4->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::EnTransito->value);

    // 5. Recepción con novedad -> Recepción con Novedades (Bloqueada)
    $r5 = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::RecepcionConNovedades->value,
        ]);
    $r5->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::RecepcionConNovedades->value);

    // 6. Resolución hacia cierre -> Entregada / Cerrada (exige resolucion_novedad_tipo y resolucion_novedad_comentario)
    $r6 = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::EntregadaCerrada->value,
            'resolucion_novedad_tipo' => 'nota_credito',
            'resolucion_novedad_comentario' => 'Acordado con el cliente nota de crédito por diferencias.',
        ]);
    $r6->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::EntregadaCerrada->value);
});

it('valida que devolver por gerencia exige motivo_rechazo_gerencia obligatorio y permite reenvio', function () {
    $gerente = createUserWithRole('Gerente Comercial');
    $asesor = createUserWithRole('Vendedor');

    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::EnEsperaAprobacionGerencial->value,
        'color' => OrdenCompraEstado::EnEsperaAprobacionGerencial->color(),
    ]);

    // 1. Gerente intenta devolver sin motivo -> 422
    $fail = $this->actingAs($gerente, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::DevueltaPorGerencia->value,
        ]);
    $fail->assertStatus(422)->assertJsonValidationErrors('motivo_rechazo_gerencia');

    // 2. Gerente devuelve con motivo -> Exitoso
    $motivo = 'El margen de ganancia es inferior al mínimo requerido. Renegociar costo.';
    $ok = $this->actingAs($gerente, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::DevueltaPorGerencia->value,
            'motivo_rechazo_gerencia' => $motivo,
        ]);
    $ok->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::DevueltaPorGerencia->value);

    $ordenFresca = $orden->fresh();
    expect($ordenFresca->motivo_rechazo_gerencia)->toBe($motivo);

    // 3. Asesor (Vendedor) reenvía la orden corregida a Aprobación Gerencial
    $reenvio = $this->actingAs($asesor, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::EnEsperaAprobacionGerencial->value,
        ]);
    $reenvio->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::EnEsperaAprobacionGerencial->value);
});

it('valida que transicionar a Pagada / Lista para Despacho exige comprobante_pago_ruta obligatorio', function () {
    $contabilidad = createUserWithRole('Contabilidad');

    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::PendienteDePago->value,
        'color' => OrdenCompraEstado::PendienteDePago->color(),
    ]);

    // 1. Falla sin comprobante_pago_ruta
    $fail = $this->actingAs($contabilidad, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PagadaListaDespacho->value,
            'referencia_pago' => 'TRANSF-12345',
        ]);
    $fail->assertStatus(422)->assertJsonValidationErrors('comprobante_pago_ruta');

    // 2. Permite subir el comprobante de pago por el endpoint
    Storage::fake('public');
    $file = UploadedFile::fake()->create('comprobante.pdf', 500, 'application/pdf');

    $upload = $this->actingAs($contabilidad, 'sanctum')
        ->postJson("/v1/ordenes-compra/{$orden->id}/upload-comprobante", [
            'file' => $file,
        ]);
    $upload->assertOk()
        ->assertJsonPath('success', true);

    $filePath = $upload->json('file_name');
    Storage::disk('public')->assertExists($filePath);

    // 3. Ahora transiciona exitosamente a Pagada / Lista para Despacho
    $ok = $this->actingAs($contabilidad, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::PagadaListaDespacho->value,
            'referencia_pago' => 'TRANSF-12345',
            'comprobante_pago_ruta' => $filePath,
        ]);
    $ok->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::PagadaListaDespacho->value);
    expect($orden->fresh()->pagado_por_id)->toBe($contabilidad->id);
    expect($orden->fresh()->comprobante_pago_ruta)->toBe($filePath);

    // 4. Contingencia post-pago: Cancelada - Reembolso Pendiente
    $cancelPostPago = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/ordenes-compra/{$orden->id}/transition", [
            'estado_destino' => OrdenCompraEstado::CanceladaReembolsoPendiente->value,
            'motivo_reembolso' => 'Proveedor reportó que la pieza importada se dañó antes de despachar. Reembolso total solicitado.',
        ]);
    $cancelPostPago->assertOk()->assertJsonPath('data.estado', OrdenCompraEstado::CanceladaReembolsoPendiente->value);
    expect($orden->fresh()->motivo_reembolso)->toContain('Reembolso total solicitado');
});
