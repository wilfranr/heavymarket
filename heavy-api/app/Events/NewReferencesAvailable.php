<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento NewReferencesAvailable
 *
 * Se dispara cuando hay nuevas referencias disponibles para costeo
 * que coinciden con el perfil de un proveedor.
 */
class NewReferencesAvailable implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $terceroId;

    public $count;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(int $terceroId, int $count = 1)
    {
        $this->terceroId = $terceroId;
        $this->count = $count;
        $this->message = "Tienes {$count} nuevas referencias disponibles para costeo.";
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Canal privado específico para el tercero (proveedor)
        return [
            new PrivateChannel('provider.'.$this->terceroId),
        ];
    }

    /**
     * El nombre del evento en el frontend.
     */
    public function broadcastAs(): string
    {
        return 'references.available';
    }
}
