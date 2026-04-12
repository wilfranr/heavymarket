<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PedidoReferenciaImagenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imagen = $this->imagen;
        $imagenUrl = $imagen;
        if ($imagen && ! str_starts_with($imagen, 'http')) {
            $imagenUrl = asset('storage/'.ltrim($imagen, '/'));
        }

        return [
            'id' => $this->id,
            'pedido_referencia_id' => $this->pedido_referencia_id,
            'imagen' => $imagenUrl,
            'origen' => $this->origen,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
