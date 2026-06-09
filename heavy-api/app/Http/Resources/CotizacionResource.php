<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Cotizacion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Cotizacion
 *
 * Transforma los datos de cotizaciones en una respuesta JSON estructurada.
 *
 * @property Cotizacion $resource
 */
class CotizacionResource extends JsonResource
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
            'estado' => $this->estado,
            'fecha_emision' => $this->fecha_emision?->toISOString(),
            'fecha_vencimiento' => $this->fecha_vencimiento?->toISOString(),
            'observaciones' => $this->observaciones,
            'total' => $this->total,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'user' => $this->whenLoaded('user'),
            'tercero' => $this->whenLoaded('tercero', function () {
                return new TerceroResource($this->tercero);
            }),
            'pedido' => $this->whenLoaded('pedido', function () {
                return new PedidoResource($this->pedido);
            }),
            'referencias_proveedores' => $this->whenLoaded('referenciasProveedores', function () {
                return CotizacionReferenciaProveedorResource::collection($this->referenciasProveedores);
            }),
        ];
    }
}
