<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\{Cotizacion, Pedido, CotizacionReferenciaProveedor, TRM};
use Illuminate\Support\Facades\DB;

/**
 * Servicio de lógica de negocio para Cotizaciones
 * 
 * Maneja los cálculos complejos de cotizaciones, conversiones
 * de moneda y generación de documentos.
 */
class CotizacionService
{
    /**
     * Crear cotización desde un pedido
     * 
     * @param Pedido $pedido
     * @param array<string, mixed> $datosAdicionales
     * @return Cotizacion
     */
    public function crearDesdePedido(Pedido $pedido, array $datosAdicionales = []): Cotizacion
    {
        return DB::transaction(function () use ($pedido, $datosAdicionales) {
            $cotizacion = Cotizacion::create([
                'pedido_id' => $pedido->id,
                'tercero_id' => $pedido->tercero_id,
                'user_id' => $datosAdicionales['user_id'] ?? auth()->id(),
                'estado' => 'En_Proceso',
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(30),
            ]);

            // Copiar referencias del pedido a la cotización
            foreach ($pedido->referencias as $pedidoReferencia) {
                CotizacionReferenciaProveedor::create([
                    'cotizacion_id' => $cotizacion->id,
                    'referencia_id' => $pedidoReferencia->referencia_id,
                    'cantidad' => $pedidoReferencia->cantidad,
                    'precio_unitario' => 0, // Se completará después
                ]);
            }

            return $cotizacion->load('referencias');
        });
    }

    /**
     * Calcular precio total de una cotización
     * 
     * @param Cotizacion $cotizacion
     * @param string $moneda 'COP' o 'USD'
     * @return float
     */
    public function calcularPrecioTotal(Cotizacion $cotizacion, string $moneda = 'COP'): float
    {
        $total = $cotizacion->referencias->sum(function ($item) {
            return $item->cantidad * $item->precio_unitario;
        });

        // Si se requiere en USD, convertir
        if ($moneda === 'USD' && $total > 0) {
            $trm = $this->obtenerTRM();
            $total = $total / $trm;
        }

        return round($total, 2);
    }

    /**
     * Aplicar margen de ganancia
     * 
     * @param float $precioBase
     * @param float $porcentajeMargen
     * @return float
     */
    public function aplicarMargen(float $precioBase, float $porcentajeMargen): float
    {
        return round($precioBase * (1 + $porcentajeMargen / 100), 2);
    }

    /**
     * Calcular precio con impuestos
     * 
     * @param float $precioBase
     * @param float $porcentajeIVA
     * @return array{subtotal: float, iva: float, total: float}
     */
    public function calcularConImpuestos(float $precioBase, float $porcentajeIVA = 19): array
    {
        $subtotal = $precioBase;
        $iva = round($subtotal * ($porcentajeIVA / 100), 2);
        $total = $subtotal + $iva;

        return [
            'subtotal' => $subtotal,
            'iva' => $iva,
            'total' => $total,
        ];
    }

    /**
     * Obtener la TRM actual
     * 
     * @return float
     */
    private function obtenerTRM(): float
    {
        $trm = TRM::orderBy('fecha', 'desc')->first();
        return $trm?->valor ?? 4000.0; // Valor por defecto si no hay TRM
    }

    /**
     * Aprobar cotización
     * 
     * @param Cotizacion $cotizacion
     * @return Cotizacion
     */
    public function aprobar(Cotizacion $cotizacion): Cotizacion
    {
        $cotizacion->update([
            'estado' => 'Aprobada',
            'fecha_aprobacion' => now(),
        ]);

        // Actualizar estado del pedido asociado
        if ($cotizacion->pedido) {
            $cotizacion->pedido->update(['estado' => 'Cotizado']);
        }

        return $cotizacion;
    }

    /**
     * Rechazar cotización
     * 
     * @param Cotizacion $cotizacion
     * @param string $motivo
     * @return Cotizacion
     */
    public function rechazar(Cotizacion $cotizacion, string $motivo): Cotizacion
    {
        $cotizacion->update([
            'estado' => 'Rechazada',
            'motivo_rechazo' => $motivo,
        ]);

        return $cotizacion;
    }
}
