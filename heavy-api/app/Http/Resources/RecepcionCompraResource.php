<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecepcionCompraResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orden_trabajo_id' => $this->orden_trabajo_id,
            'orden_compra_id' => $this->orden_compra_id,
            'recibido_por' => $this->recibido_por,
            'fecha_recepcion' => $this->fecha_recepcion?->toISOString(),
            'numero_remision' => $this->numero_remision,
            'observaciones' => $this->observaciones,
            'estado' => $this->estado,
            'anulada_por' => $this->anulada_por,
            'fecha_anulacion' => $this->fecha_anulacion?->toISOString(),
            'motivo_anulacion' => $this->motivo_anulacion,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'orden_trabajo' => $this->whenLoaded('ordenTrabajo'),
            'orden_compra' => $this->whenLoaded('ordenCompra'),
            'recibido_por_usuario' => $this->whenLoaded('recibidoPor'),
            'anulada_por_usuario' => $this->whenLoaded('anuladaPor'),
            'detalles' => $this->whenLoaded('detalles', function () {
                return RecepcionCompraDetalleResource::collection($this->detalles);
            }),
        ];
    }
}
