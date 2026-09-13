<?php

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Logistica', 'guard_name' => 'web']);
});

it('respeta transito_prorrogado_hasta y no vuelve a marcar Demorado una OC recien reasignada', function () {
    Notification::fake();
    createUserWithRole('Logistica');

    $ordenProrrogada = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::EnTransito->value,
        'color' => OrdenCompraEstado::EnTransito->color(),
        'guia' => 'GUIA-PRORROGADA',
        'fecha_despacho' => now()->subDays(10),
        'transito_prorrogado_hasta' => now()->addDays(3),
    ]);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')->assertSuccessful();

    expect($ordenProrrogada->fresh()->estado)->toBe(OrdenCompraEstado::EnTransito->value);

    Notification::assertNothingSent();
});

it('marca Demorado una OC con prorroga ya vencida', function () {
    Notification::fake();
    createUserWithRole('Logistica');

    $ordenProrrogaVencida = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::EnTransito->value,
        'color' => OrdenCompraEstado::EnTransito->color(),
        'guia' => 'GUIA-PRORROGA-VENCIDA',
        'fecha_despacho' => now()->subDays(10),
        'transito_prorrogado_hasta' => now()->subDay(),
    ]);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')->assertSuccessful();

    expect($ordenProrrogaVencida->fresh()->estado)->toBe(OrdenCompraEstado::Demorado->value);
});

it('es idempotente: una segunda corrida no vuelve a notificar una OC ya Demorada', function () {
    Notification::fake();
    createUserWithRole('Logistica');

    OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::EnTransito->value,
        'color' => OrdenCompraEstado::EnTransito->color(),
        'guia' => 'GUIA-DOBLE-CORRIDA',
        'fecha_despacho' => now()->subDays(10),
    ]);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')->assertSuccessful();
    Notification::assertSentTimes(SystemNotification::class, 1);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')
        ->expectsOutputToContain('No se encontraron órdenes con tránsito prolongado')
        ->assertSuccessful();

    Notification::assertSentTimes(SystemNotification::class, 1);
});

it('tambien marca Demorado una OC en estado legacy Despachada', function () {
    Notification::fake();
    createUserWithRole('Logistica');

    $orden = OrdenCompra::factory()->create([
        'estado' => OrdenCompraEstado::Despachada->value,
        'color' => OrdenCompraEstado::Despachada->color(),
        'guia' => 'GUIA-LEGACY-DESPACHADA',
        'fecha_despacho' => now()->subDays(6),
    ]);

    $this->artisan('compras:alertar-transito-prolongado --dias=5')->assertSuccessful();

    expect($orden->fresh()->estado)->toBe(OrdenCompraEstado::Demorado->value);
});
