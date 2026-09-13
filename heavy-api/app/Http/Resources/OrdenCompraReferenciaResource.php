<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\EstadoRecepcion;
use App\Models\OrdenCompraReferencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo OrdenCompraReferencia (pivot)
 *
 * Transforma los datos de referencias en órdenes de compra
 * en una respuesta JSON estructurada.
 *
 * @property OrdenCompraReferencia $resource
 */
class OrdenCompraReferenciaResource extends JsonResource
{
    /**
     * Transforma el recurso en un array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cantidad = (int) $this->cantidad;
        $cantidadRecibida = (int) $this->cantidad_recibida;
        $cantidadDepurada = (int) $this->cantidad_depurada;

        return [
            'id' => $this->id,
            'orden_compra_id' => $this->orden_compra_id,
            'referencia_id' => $this->referencia_id,
            'cantidad' => $this->cantidad,
            'cantidad_original' => $this->cantidad_original,
            'motivo_faltante' => $this->motivo_faltante,
            'cantidad_recibida' => $this->cantidad_recibida,
            'cantidad_depurada' => $this->cantidad_depurada,
            'motivo_depuracion' => $this->motivo_depuracion,
            'depurado_por' => $this->depurado_por,
            'depurado_at' => $this->depurado_at?->toISOString(),
            'estado_item' => EstadoRecepcion::desdeCantidades($cantidadRecibida + $cantidadDepurada, $cantidad)->value,
            'saldo_pendiente' => max($cantidad - $cantidadRecibida - $cantidadDepurada, 0),
            'valor_unitario' => $this->valor_unitario,
            'valor_total' => $this->valor_total,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'orden_compra' => $this->whenLoaded('ordenCompra'),
            'referencia' => $this->whenLoaded('referencia'),
            'depurado_por_usuario' => $this->whenLoaded('depuradoPor'),
        ];
    }
}
