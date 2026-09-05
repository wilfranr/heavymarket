<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\OrdenTrabajoReferencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenTrabajoReferencia
 *
 * Transforma los datos de referencias en órdenes de trabajo
 * en una respuesta JSON estructurada.
 *
 * @property OrdenTrabajoReferencia $resource
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
            'cantidad_cotizada' => $this->cantidad_cotizada,
            'cantidad_recibida' => $this->cantidad_recibida,
            'cantidad_depurada' => $this->cantidad_depurada,
            'motivo_depuracion' => $this->motivo_depuracion,
            'depurado_por' => $this->depurado_por,
            'depurado_at' => $this->depurado_at?->toISOString(),
            'estado' => $this->estado,
            'recibido' => $this->recibido,
            'fecha_recepcion' => $this->fecha_recepcion?->toISOString(),
            'observaciones' => $this->observaciones,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'orden_trabajo' => $this->whenLoaded('ordenTrabajo'),
            'pedido_referencia' => $this->whenLoaded('pedidoReferencia', function () {
                return new PedidoReferenciaResource($this->pedidoReferencia);
            }),
            'referencia' => $this->whenLoaded('referencia'),
            'depurado_por_usuario' => $this->whenLoaded('depuradoPor'),
        ];
    }
}
