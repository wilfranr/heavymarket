<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenTrabajoReferencia
 *
 * Transforma los datos de referencias en órdenes de trabajo
 * en una respuesta JSON estructurada.
 *
 * @property \App\Models\OrdenTrabajoReferencia $resource
 */
class OrdenTrabajoReferenciaResource extends JsonResource
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
            'orden_trabajo_id' => $this->orden_trabajo_id,
            'pedido_referencia_id' => $this->pedido_referencia_id,
            'cantidad' => $this->cantidad,
            'cantidad_recibida' => $this->cantidad_recibida,
            'estado' => $this->estado,
            'recibido' => $this->recibido,
            'fecha_recepcion' => $this->fecha_recepcion?->toISOString(),
            'observaciones' => $this->observaciones,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'orden_trabajo' => $this->whenLoaded('ordenTrabajo'),
            'pedido_referencia' => $this->whenLoaded('pedidoReferencia'),
            'referencia' => $this->whenLoaded('referencia'),
        ];
    }
}
