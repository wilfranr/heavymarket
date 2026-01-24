<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo PedidoReferenciaProveedor
 *
 * Transforma los datos de proveedores de referencias en una respuesta JSON estructurada.
 *
 * @property \App\Models\PedidoReferenciaProveedor $resource
 */
class PedidoReferenciaProveedorResource extends JsonResource
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
            'pedido_referencia_id' => $this->pedido_referencia_id,
            'referencia_id' => $this->referencia_id,
            'tercero_id' => $this->tercero_id,
            'marca_id' => $this->marca_id,
            'dias_entrega' => $this->dias_entrega,
            'costo_unidad' => $this->costo_unidad,
            'utilidad' => $this->utilidad,
            'valor_unidad' => $this->valor_unidad,
            'valor_total' => $this->valor_total,
            'ubicacion' => $this->ubicacion,
            'estado' => $this->estado,
            'cantidad' => $this->cantidad,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'tercero' => $this->whenLoaded('tercero'),
            'marca' => $this->whenLoaded('marca'),
            'referencia' => $this->whenLoaded('referencia'),
        ];
    }
}
