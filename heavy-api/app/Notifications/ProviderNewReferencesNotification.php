<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProviderNewReferencesNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $count;

    public $pedidoId;

    /**
     * Create a new notification instance.
     */
    public function __construct(int $count, int $pedidoId)
    {
        $this->count = $count;
        $this->pedidoId = $pedidoId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nuevas oportunidades de costeo en HeavyMarket')
            ->line("Tienes {$this->count} nuevas referencias disponibles para costear del Pedido #{$this->pedidoId}.")
            ->action('Ir al Portal de Proveedores', url('/#/provider/opportunities'))
            ->line('¡Asegúrate de enviar tus mejores precios lo antes posible!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_references_available',
            'title' => 'Nuevas referencias para costear',
            'message' => "Tienes {$this->count} nuevas referencias disponibles del Pedido #{$this->pedidoId}.",
            'icon' => 'pi-shopping-bag',
            'iconColor' => 'green',
            'data' => [
                'pedido_id' => $this->pedidoId,
                'count' => $this->count,
            ],
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => 'new_references_available',
            'title' => 'Nuevas referencias para costear',
            'message' => "Tienes {$this->count} nuevas referencias disponibles del Pedido #{$this->pedidoId}.",
            'icon' => 'pi-shopping-bag',
            'iconColor' => 'green',
            'data' => [
                'pedido_id' => $this->pedidoId,
                'count' => $this->count,
            ],
            'read' => false,
            'created_at' => now()->toISOString(),
        ]);
    }
}
