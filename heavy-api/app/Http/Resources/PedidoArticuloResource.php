<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo PedidoArticulo
 *
 * Transforma los datos de artículos de pedidos en una respuesta JSON estructurada.
 *
 * @property \App\Models\PedidoArticulo $resource
 */
class PedidoArticuloResource extends JsonResource
{
    /**
     * Transforma el recurso en un array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pedido_id' => $this->pedido_id,
            'articulo_id' => $this->articulo_id,
            'cantidad' => $this->cantidad,
            'comentario' => $this->comentario,
            'sistema_id' => $this->sistema_id,
            'imagen' => $this->imagen,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'articulo' => $this->whenLoaded('articulo'),
            'sistema' => $this->whenLoaded('sistema'),
        ];
    }
}
