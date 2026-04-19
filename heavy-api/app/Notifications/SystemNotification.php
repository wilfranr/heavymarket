<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    public $type;

    public $title;

    public $message;

    public $icon;

    public $iconColor;

    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $type, string $title, string $message, string $icon, string $iconColor, array $data = [])
    {
        $this->type = $type;
        $this->title = $title;
        $this->message = $message;
        $this->icon = $icon;
        $this->iconColor = $iconColor;
        $this->data = $data;
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
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon,
            'iconColor' => $this->iconColor,
            'data' => $this->data,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon,
            'iconColor' => $this->iconColor,
            'data' => $this->data,
            'read' => false,
            'created_at' => now()->toISOString(),
        ]);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('HeavyMarket: ' . $this->title)
            ->greeting('Hola ' . ($notifiable->name ?? 'Usuario') . '!')
            ->line($this->message)
            ->action('Ver en HeavyMarket', url('/#/dashboard/notifications'))
            ->line('Este es un mensaje automático, por favor no responda a este correo.')
            ->salutation('Atentamente, El equipo de HeavyMarket');
    }
}
