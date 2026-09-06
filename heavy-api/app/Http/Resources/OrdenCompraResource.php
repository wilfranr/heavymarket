<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\OrdenCompra;
use App\Services\OrdenCompraLifecycleService;
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
            'color' => $this->color,
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
            'fecha_despacho' => $this->fecha_despacho?->toISOString(),
            'fecha_aprobacion_gerencia' => $this->fecha_aprobacion_gerencia?->toISOString(),
            'fecha_pago' => $this->fecha_pago?->toISOString(),
            'fecha_resolucion_novedad' => $this->fecha_resolucion_novedad?->toISOString(),
            'instrucciones_despacho' => $this->instrucciones_despacho,
            'motivo_rechazo_gerencia' => $this->motivo_rechazo_gerencia,
            'aprobado_por_gerente_id' => $this->aprobado_por_gerente_id,
            'comprobante_pago_ruta' => $this->comprobante_pago_ruta,
            'pagado_por_id' => $this->pagado_por_id,
            'referencia_pago' => $this->referencia_pago,
            'motivo_reembolso' => $this->motivo_reembolso,
            'resolucion_novedad_tipo' => $this->resolucion_novedad_tipo,
            'resolucion_novedad_comentario' => $this->resolucion_novedad_comentario,
            'resuelto_por_id' => $this->resuelto_por_id,
            'estado_recepcion' => app(OrdenCompraLifecycleService::class)
                ->calcularEstadoRecepcion($this->resource)?->value,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'tercero' => $this->whenLoaded('tercero'),
            'transportadora' => $this->whenLoaded('transportadora'),
            'proveedor' => $this->whenLoaded('proveedor'),
            'pedido' => $this->whenLoaded('pedido'),
            'cotizacion' => $this->whenLoaded('cotizacion'),
            'archivos_despacho' => $this->whenLoaded('archivosDespacho'),
            'detalles' => $this->whenLoaded('detalles', function () {
                return OrdenCompraReferenciaResource::collection($this->detalles);
            }),
        ];
    }
}
