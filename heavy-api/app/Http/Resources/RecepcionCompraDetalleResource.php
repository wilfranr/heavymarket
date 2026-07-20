<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecepcionCompraDetalleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recepcion_compra_id' => $this->recepcion_compra_id,
            'orden_compra_detalle_id' => $this->orden_compra_detalle_id,
            'cantidad_recibida' => $this->cantidad_recibida,
            'cantidad_conforme' => $this->cantidad_conforme,
            'cantidad_rechazada' => $this->cantidad_rechazada,
            'motivo_rechazo' => $this->motivo_rechazo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'orden_compra_detalle' => $this->whenLoaded('ordenCompraDetalle'),
        ];
    }
}
