<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo CotizacionReferenciaProveedor
 *
 * Transforma los datos de referencias y proveedores en cotizaciones
 * en una respuesta JSON estructurada.
 *
 * @property \App\Models\CotizacionReferenciaProveedor $resource
 */
class CotizacionReferenciaProveedorResource extends JsonResource
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
            'cotizacion_id' => $this->cotizacion_id,
            'pedido_referencia_proveedor_id' => $this->pedido_referencia_proveedor_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'pedido_referencia_proveedor' => $this->whenLoaded('pedidoReferenciaProveedor'),
        ];
    }
}
