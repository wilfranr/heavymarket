<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenTrabajo
 *
 * Transforma los datos de órdenes de trabajo en una respuesta JSON estructurada.
 *
 * @property \App\Models\OrdenTrabajo $resource
 */
class OrdenTrabajoResource extends JsonResource
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
            'user_id' => $this->user_id,
            'tercero_id' => $this->tercero_id,
            'pedido_id' => $this->pedido_id,
            'cotizacion_id' => $this->cotizacion_id,
            'estado' => $this->estado,
            'fecha_ingreso' => $this->fecha_ingreso?->toISOString(),
            'fecha_entrega' => $this->fecha_entrega?->toISOString(),
            'direccion_id' => $this->direccion_id,
            'telefono' => $this->telefono,
            'observaciones' => $this->observaciones,
            'guia' => $this->guia,
            'transportadora_id' => $this->transportadora_id,
            'archivo' => $this->archivo,
            'motivo_cancelacion' => $this->motivo_cancelacion,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'user' => $this->whenLoaded('user'),
            'tercero' => $this->whenLoaded('tercero'),
            'pedido' => $this->whenLoaded('pedido'),
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'transportadora' => $this->whenLoaded('transportadora'),
            'direccion' => $this->whenLoaded('direccion'),
            'referencias' => $this->whenLoaded('referencias', function () {
                return OrdenTrabajoReferenciaResource::collection($this->referencias);
            }),
        ];
    }
}
