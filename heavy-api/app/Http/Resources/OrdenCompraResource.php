<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\OrdenCompra;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenCompra
 *
 * Transforma los datos de órdenes de compra en una respuesta JSON estructurada.
 *
 * @property OrdenCompra $resource
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
            'tercero_id' => $this->tercero_id,
            'pedido_id' => $this->pedido_id,
            'cotizacion_id' => $this->cotizacion_id,
            'proveedor_id' => $this->proveedor_id,
            'estado' => $this->estado,
            'fecha_expedicion' => $this->fecha_expedicion?->toISOString(),
            'fecha_entrega' => $this->fecha_entrega?->toISOString(),
            'fecha_envio' => $this->fecha_envio?->toISOString(),
            'fecha_confirmacion' => $this->fecha_confirmacion?->toISOString(),
            'fecha_recepcion' => $this->fecha_recepcion?->toISOString(),
            'observaciones' => $this->observaciones,
            'motivo_cancelacion' => $this->motivo_cancelacion,
            'notas_cierre' => $this->notas_cierre,
            'cantidad' => $this->cantidad,
            'direccion' => $this->direccion,
            'telefono' => $this->telefono,
            'valor_unitario' => $this->valor_unitario,
            'valor_total' => $this->valor_total,
            'valor_iva' => $this->valor_iva,
            'valor_descuento' => $this->valor_descuento,
            'guia' => $this->guia,
            'transportadora_id' => $this->transportadora_id,
            'color' => $this->color,
            'fecha_despacho' => $this->fecha_despacho?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'tercero' => $this->whenLoaded('tercero'),
            'transportadora' => $this->whenLoaded('transportadora'),
            'proveedor' => $this->whenLoaded('proveedor'),
            'pedido' => $this->whenLoaded('pedido'),
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'detalles' => $this->whenLoaded('detalles', function () {
                return OrdenCompraReferenciaResource::collection($this->detalles);
            }),
        ];
    }
}
