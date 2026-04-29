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

it('debug update cotizacion', function () {
    $cotizacion = Cotizacion::factory()->pendiente()->create();

    $response = $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/v1/cotizaciones/{$cotizacion->id}", [
            'estado' => 'Enviada',
            'observaciones' => 'Cotización enviada al cliente',
        ]);

    // Dump raw response content
    echo "\n=== RESPONSE ===\n";
    echo "Status: " . $response->status() . "\n";
    echo "Content: " . $response->content() . "\n";
    echo "================\n";

    $response->assertStatus(200);
});
