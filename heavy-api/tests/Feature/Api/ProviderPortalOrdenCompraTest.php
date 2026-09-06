<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\Referencia;
use App\Models\Tercero;
use App\Models\Transportadora;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

it('registra despacho transicionando a estado en transito con fotos obligatorias', function () {
    Storage::fake('public');

    $transportadora = Transportadora::factory()->create();
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::PagadaListaDespacho->value,
        'color' => OrdenCompraEstado::PagadaListaDespacho->color(),
    ]);

    $foto = UploadedFile::fake()->image('paquete_embalado.jpg', 800, 600);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->postJson("/v1/provider/purchase-orders/{$orden->id}/dispatch", [
            'guia' => 'GUIA-123',
            'transportadora_id' => $transportadora->id,
            'fecha_despacho' => now()->toDateString(),
            'observaciones' => 'Despachado por transportadora.',
            'fotos' => [$foto],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::EnTransito->value)
        ->assertJsonPath('data.guia', 'GUIA-123')
        ->assertJsonCount(1, 'data.archivos_despacho');

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::EnTransito->value,
        'guia' => 'GUIA-123',
    ]);

    $this->assertDatabaseHas('orden_compra_despacho_archivos', [
        'orden_compra_id' => $orden->id,
        'nombre_original' => 'paquete_embalado.jpg',
    ]);
});

it('rechaza el registro de despacho si no se adjuntan fotos o guia', function () {
    $transportadora = Transportadora::factory()->create();
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::PagadaListaDespacho->value,
        'color' => OrdenCompraEstado::PagadaListaDespacho->color(),
    ]);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->postJson("/v1/provider/purchase-orders/{$orden->id}/dispatch", [
            'guia' => 'GUIA-123',
            'transportadora_id' => $transportadora->id,
            'fecha_despacho' => now()->toDateString(),
            'fotos' => [],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['fotos']);
});

it('ejecuta comando de alerta de transito prolongado correctamente', function () {
    Role::firstOrCreate(['name' => 'Logistica', 'guard_name' => 'web']);
    $logisticaUser = createUserWithRole('Logistica');

    $transportadora = Transportadora::factory()->create();
    $ordenVencida = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::EnTransito->value,
        'color' => OrdenCompraEstado::EnTransito->color(),
        'guia' => 'GUIA-PROLONGADA-99',
        'fecha_despacho' => now()->subDays(10),
    ]);

    $ordenReciente = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::EnTransito->value,
        'color' => OrdenCompraEstado::EnTransito->color(),
        'guia' => 'GUIA-RECIENTE-01',
        'fecha_despacho' => now()->subDay(),
    ]);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')
        ->expectsOutputToContain('Se encontraron 1 órdenes con tránsito prolongado')
        ->expectsOutputToContain('GUIA-PROLONGADA-99')
        ->assertSuccessful();
});

it('permite al proveedor confirmar stock completo en orden pendiente de revision', function () {
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::PendienteRevisionStock->value,
        'color' => OrdenCompraEstado::PendienteRevisionStock->color(),
    ]);

    $ref = Referencia::factory()->create();
    OrdenCompraReferencia::create([
        'orden_compra_id' => $orden->id,
        'referencia_id' => $ref->id,
        'cantidad' => 10,
        'valor_unitario' => 50000,
        'valor_total' => 500000,
    ]);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->postJson("/v1/provider/purchase-orders/{$orden->id}/confirm", [
            'observaciones' => 'Todo el inventario disponible.',
            'items' => [
                [
                    'referencia_id' => $ref->id,
                    'cantidad_disponible' => 10,
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::EnEsperaAprobacionGerencial->value);

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::EnEsperaAprobacionGerencial->value,
    ]);
});

it('transiciona a Stock Incompleto y recalcula totales si el proveedor reporta faltantes', function () {
    $orden = OrdenCompra::factory()->create([
        'proveedor_id' => $this->proveedor->id,
        'estado' => OrdenCompraEstado::PendienteRevisionStock->value,
        'color' => OrdenCompraEstado::PendienteRevisionStock->color(),
        'valor_total' => 500000,
    ]);

    $ref = Referencia::factory()->create();
    $item = OrdenCompraReferencia::create([
        'orden_compra_id' => $orden->id,
        'referencia_id' => $ref->id,
        'cantidad' => 10,
        'valor_unitario' => 50000,
        'valor_total' => 500000,
    ]);

    $response = $this->actingAs($this->providerUser, 'sanctum')
        ->postJson("/v1/provider/purchase-orders/{$orden->id}/confirm", [
            'observaciones' => 'Solo tenemos 6 unidades en bodega.',
            'items' => [
                [
                    'referencia_id' => $ref->id,
                    'cantidad_disponible' => 6,
                    'motivo_faltante' => 'Quiebre de stock por importación demorada',
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.estado', OrdenCompraEstado::StockIncompleto->value);

    $this->assertDatabaseHas('orden_compras', [
        'id' => $orden->id,
        'estado' => OrdenCompraEstado::StockIncompleto->value,
        'valor_total' => 300000,
    ]);

    $this->assertDatabaseHas('orden_compra_referencia', [
        'id' => $item->id,
        'cantidad_original' => 10,
        'cantidad' => 6,
        'valor_total' => 300000,
        'motivo_faltante' => 'Quiebre de stock por importación demorada',
    ]);
});
