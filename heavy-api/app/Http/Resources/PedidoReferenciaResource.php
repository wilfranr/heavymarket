<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
        $imagenUrl = $this->imagen;
        if ($imagenUrl && ! str_starts_with($imagenUrl, 'http')) {
            $imagenUrl = asset('storage/'.ltrim($imagenUrl, '/'));
        }

        return [
            'id' => $this->id,
            'pedido_id' => $this->pedido_id,
            'referencia_id' => $this->referencia_id,
            'sistema_id' => $this->sistema_id,
            'lista_id' => $this->lista_id,
            'marca_id' => $this->marca_id,
            'definicion' => $this->definicion,
            'cantidad' => $this->cantidad,
            'comentario' => $this->comentario,
            'imagen' => $imagenUrl,
            'mostrar_referencia' => $this->mostrar_referencia,
            'estado' => $this->estado,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales (incluye articulo con definicion / descripcionEspecifica cuando está cargado)
            'referencia' => ReferenciaResource::make($this->whenLoaded('referencia')),
            'sistema' => $this->whenLoaded('sistema'),
            'lista' => $this->whenLoaded('lista'),
            'marca' => $this->whenLoaded('marca'),
            'imagenes' => $this->whenLoaded('imagenes', function () {
                return PedidoReferenciaImagenResource::collection($this->imagenes);
            }),
            'proveedores' => $this->whenLoaded('proveedores', function () {
                return PedidoReferenciaProveedorResource::collection($this->proveedores);
            }),
        ];
    }
}
