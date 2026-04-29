<?php

use App\Models\Cotizacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
    $this->admin = \App\Models\User::factory()->create();
    $this->admin->assignRole('Administrador');
});

it('debug update cotizacion direct', function () {
    $cotizacion = Cotizacion::factory()->pendiente()->create();

    // Direct update test without controller
    $result = $cotizacion->update([
        'estado' => 'Enviada',
        'observaciones' => 'Cotización enviada al cliente',
    ]);

    echo "\n=== DIRECT UPDATE ===\n";
    echo "Result: " . ($result ? 'true' : 'false') . "\n";
    echo "Model estado: " . $cotizacion->estado . "\n";
    echo "================\n";

    $cotizacion->refresh();
    expect($cotizacion->estado)->toBe('Enviada');
});
