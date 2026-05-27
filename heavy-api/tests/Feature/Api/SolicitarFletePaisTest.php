<?php

/**
 * Tests para solicitud de tarifa de flete a administración
 */

use App\Models\Country;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    Notification::fake();

    $this->analista = createUserWithRole('Analista');
    $this->admin = createUserWithRole('Administrador');
});

it('analista puede solicitar flete y notifica a administradores', function () {
    $usa = Country::factory()->create(['name' => 'Estados Unidos', 'iso2' => 'US', 'flete' => null]);
    $proveedor = Tercero::factory()->create(['tipo' => 'Proveedor', 'country_id' => $usa->id]);
    $pedido = Pedido::factory()->create(['estado' => 'En_Costeo', 'user_id' => $this->analista->id]);

    $response = $this->actingAs($this->analista, 'sanctum')
        ->postJson("/v1/countries/{$usa->id}/solicitar-flete", [
            'flete' => 3.25,
            'proveedor_id' => $proveedor->id,
            'pedido_id' => $pedido->id,
        ]);

    $response->assertOk()
        ->assertJsonPath('notificaciones_enviadas', 1);

    Notification::assertSentTo(
        $this->admin,
        SystemNotification::class,
        fn (SystemNotification $n) => $n->type === 'freight_rate_request'
            && ($n->data['flete_solicitado'] ?? null) == 3.25
            && ($n->data['country_id'] ?? null) === $usa->id
    );
});

it('rechaza solicitud si el proveedor no pertenece al país', function () {
    $usa = Country::factory()->create(['iso2' => 'US']);
    $mexico = Country::factory()->create(['iso2' => 'MX']);
    $proveedor = Tercero::factory()->create(['country_id' => $mexico->id]);
    $pedido = Pedido::factory()->create(['user_id' => $this->analista->id]);

    $this->actingAs($this->analista, 'sanctum')
        ->postJson("/v1/countries/{$usa->id}/solicitar-flete", [
            'flete' => 2.5,
            'proveedor_id' => $proveedor->id,
            'pedido_id' => $pedido->id,
        ])
        ->assertStatus(422);
});
