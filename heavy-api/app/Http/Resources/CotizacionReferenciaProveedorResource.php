<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CotizacionReferenciaProveedor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo CotizacionReferenciaProveedor
 *
 * Transforma los datos de referencias y proveedores en cotizaciones
 * en una respuesta JSON estructurada.
 *
 * @property CotizacionReferenciaProveedor $resource
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
            'mostrar_referencia' => (bool) $this->mostrar_referencia,
            'snapshot_referencia' => $this->snapshot_referencia,
            'snapshot_descripcion' => $this->snapshot_descripcion,
            'snapshot_marca_id' => $this->snapshot_marca_id,
            'snapshot_marca' => $this->snapshot_marca,
            'snapshot_proveedor_id' => $this->snapshot_proveedor_id,
            'snapshot_proveedor_nombre' => $this->snapshot_proveedor_nombre,
            'snapshot_entrega' => $this->snapshot_entrega,
            'snapshot_cantidad' => $this->snapshot_cantidad,
            'snapshot_valor_unidad' => $this->snapshot_valor_unidad,
            'snapshot_valor_total' => $this->snapshot_valor_total,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'pedido_referencia_proveedor' => $this->whenLoaded('pedidoReferenciaProveedor'),
        ];
    }
}
