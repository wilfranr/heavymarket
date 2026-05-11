<?php

namespace Tests\Feature\Api\V1;

use App\Enums\PedidoEstado;
use App\Events\NewReferencesAvailable;
use App\Models\Lista;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\Tercero;
use App\Models\User;
use App\Notifications\ProviderNewReferencesNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PedidoNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected $vendedor;

    protected $analista;

    protected $providerUser;

    protected $terceroProvider;

    protected $marca;

    protected $categoria;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Roles
        Role::create(['name' => 'Proveedor', 'guard_name' => 'web']);
        Role::create(['name' => 'Analista', 'guard_name' => 'web']);

        // Users
        $this->vendedor = User::factory()->create();
        $this->analista = User::factory()->create();
        $this->analista->assignRole('Analista');

        $this->providerUser = User::factory()->create();
        $this->providerUser->assignRole('Proveedor');

        // Provider Tercero
        $this->terceroProvider = Tercero::factory()->create([
            'user_id' => $this->providerUser->id,
            'provider_access' => true,
            'tipo' => 'Proveedor',
        ]);

        // Specialty
        $this->marca = Lista::create(['nombre' => 'Caterpillar', 'tipo' => 'Fabricantes']);
        $this->categoria = Lista::create(['nombre' => 'Empaques', 'tipo' => 'Categoría Comercial']);

        $this->terceroProvider->fabricantes()->attach($this->marca->id);
        $this->terceroProvider->categoriasComerciales()->attach($this->categoria->id);
    }

    /** @test */
    public function test_providers_are_notified_when_pedido_is_sent_to_costeo()
    {
        Notification::fake();
        Event::fake([NewReferencesAvailable::class]);

        $pedido = Pedido::factory()->create([
            'user_id' => $this->vendedor->id,
            'estado' => PedidoEstado::En_Analisis->value,
        ]);

        PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $this->marca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $response = $this->actingAs($this->analista)
            ->postJson("/v1/pedidos/{$pedido->id}/enviar-a-costeo");

        $response->assertStatus(200);

        // Check Notification
        Notification::assertSentTo(
            $this->providerUser,
            ProviderNewReferencesNotification::class,
            function ($notification) use ($pedido) {
                return $notification->pedidoId === $pedido->id && $notification->count === 1;
            }
        );

        // Check Event Broadcast
        Event::assertDispatched(NewReferencesAvailable::class, function ($event) {
            return $event->terceroId === $this->terceroProvider->id && $event->count === 1;
        });
    }

    /** @test */
    public function test_providers_without_matching_specialty_are_not_notified()
    {
        Notification::fake();
        Event::fake([NewReferencesAvailable::class]);

        $otraMarca = Lista::create(['nombre' => 'Komatsu', 'tipo' => 'Fabricantes']);

        $pedido = Pedido::factory()->create([
            'user_id' => $this->vendedor->id,
            'estado' => PedidoEstado::En_Analisis->value,
        ]);

        // Reference with a brand the provider doesn't handle
        PedidoReferencia::factory()->create([
            'pedido_id' => $pedido->id,
            'marca_id' => $otraMarca->id,
            'categoria_comercial_id' => $this->categoria->id,
        ]);

        $this->actingAs($this->analista)
            ->postJson("/v1/pedidos/{$pedido->id}/enviar-a-costeo");

        Notification::assertNotSentTo($this->providerUser, ProviderNewReferencesNotification::class);
        Event::assertNotDispatched(NewReferencesAvailable::class);
    }
}
