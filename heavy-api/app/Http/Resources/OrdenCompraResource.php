<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenCompra
 *
 * Transforma los datos de órdenes de compra en una respuesta JSON estructurada.
 *
 * @property \App\Models\OrdenCompra $resource
 */
class OrdenCompraResource extends JsonResource
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
            'proveedor_id' => $this->proveedor_id,
            'estado' => $this->estado,
            'pedido_referencia_id' => $this->pedido_referencia_id,
            'fecha_expedicion' => $this->fecha_expedicion?->toISOString(),
            'fecha_entrega' => $this->fecha_entrega?->toISOString(),
            'observaciones' => $this->observaciones,
            'cantidad' => $this->cantidad,
            'direccion' => $this->direccion,
            'telefono' => $this->telefono,
            'valor_unitario' => $this->valor_unitario,
            'valor_total' => $this->valor_total,
            'valor_iva' => $this->valor_iva,
            'valor_descuento' => $this->valor_descuento,
            'guia' => $this->guia,
            'color' => $this->color,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'user' => $this->whenLoaded('user'),
            'tercero' => $this->whenLoaded('tercero'),
            'proveedor' => $this->whenLoaded('proveedor'),
            'pedido' => $this->whenLoaded('pedido'),
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'pedido_referencia' => $this->whenLoaded('pedidoReferencia'),
            'referencias' => $this->whenLoaded('referencias', function () {
                return OrdenCompraReferenciaResource::collection($this->referencias);
            }),
        ];
    }
}
