<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
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
        return ['database'];
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
}
