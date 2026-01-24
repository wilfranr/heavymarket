<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenCompraReferencia (pivot)
 *
 * Transforma los datos de referencias en órdenes de compra
 * en una respuesta JSON estructurada.
 *
 * @property \App\Models\OrdenCompraReferencia $resource
 */
class OrdenCompraReferenciaResource extends JsonResource
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
            'orden_compra_id' => $this->orden_compra_id,
            'referencia_id' => $this->referencia_id,
            'cantidad' => $this->cantidad,
            'valor_unitario' => $this->valor_unitario,
            'valor_total' => $this->valor_total,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'orden_compra' => $this->whenLoaded('ordenCompra'),
            'referencia' => $this->whenLoaded('referencia'),
        ];
    }
}
