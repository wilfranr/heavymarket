<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\PedidoReferenciaProveedorResource;

/**
 * API Resource para el modelo PedidoReferencia
 *
 * Transforma los datos de referencias de pedidos en una respuesta JSON estructurada.
 *
 * @property \App\Models\PedidoReferencia $resource
 */
class PedidoReferenciaResource extends JsonResource
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
            'pedido_id' => $this->pedido_id,
            'referencia_id' => $this->referencia_id,
            'sistema_id' => $this->sistema_id,
            'marca_id' => $this->marca_id,
            'definicion' => $this->definicion,
            'cantidad' => $this->cantidad,
            'comentario' => $this->comentario,
            'imagen' => $this->imagen,
            'mostrar_referencia' => $this->mostrar_referencia,
            'estado' => $this->estado,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'referencia' => $this->whenLoaded('referencia'),
            'sistema' => $this->whenLoaded('sistema'),
            'marca' => $this->whenLoaded('marca'),
            'proveedores' => $this->whenLoaded('proveedores', function () {
                return PedidoReferenciaProveedorResource::collection($this->proveedores);
            }),
        ];
    }
}
