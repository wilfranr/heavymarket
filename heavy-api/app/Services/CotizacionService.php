<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\Pedido;
use App\Models\TRM;
use App\Models\Empresa;
use Barryvdh\DomPDF\Facade\Pdf;
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
     * @param  array<string, mixed>  $datosAdicionales
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

            return $cotizacion->load('referenciasProveedores');
        });
    }

    /**
     * Calcular precio total de una cotización
     *
     * @param  string  $moneda  'COP' o 'USD'
     */
    public function calcularPrecioTotal(Cotizacion $cotizacion, string $moneda = 'COP'): float
    {
        $total = $cotizacion->referenciasProveedores->sum(function ($item) {
            $prp = $item->pedidoReferenciaProveedor;
            return $prp ? $prp->cantidad * $prp->precio_unitario : 0;
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
     */
    public function aplicarMargen(float $precioBase, float $porcentajeMargen): float
    {
        return round($precioBase * (1 + $porcentajeMargen / 100), 2);
    }

    /**
     * Calcular precio con impuestos
     *
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
     */
    private function obtenerTRM(): float
    {
        $trm = TRM::orderBy('fecha', 'desc')->first();

        return $trm?->trm ?? 4000.0; // Valor por defecto si no hay TRM
    }

    /**
     * Aprobar cotización
     */
    public function aprobar(Cotizacion $cotizacion): Cotizacion
    {
        $cotizacion->update([
            'estado' => 'Aprobada',
        ]);

        // Actualizar estado del pedido asociado
        if ($cotizacion->pedido) {
            $cotizacion->pedido->update(['estado' => 'Cotizado']);
        }

        return $cotizacion;
    }

    /**
     * Rechazar cotización
     */
    public function rechazar(Cotizacion $cotizacion, string $motivo = ''): Cotizacion
    {
        $cotizacion->update([
            'estado' => 'Rechazada',
            'observaciones' => $motivo ? trim(($cotizacion->observaciones ?: '') . "\nRechazo: " . $motivo) : $cotizacion->observaciones,
        ]);

        return $cotizacion;
    }

    /**
     * Generar PDF de la cotización
     */
    public function generarPDF(Cotizacion $cotizacion)
    {
        $cotizacion->load([
            'pedido.tercero.city',
            'pedido.contacto',
            'pedido.maquina',
            'user',
            'referenciasProveedores.pedidoReferenciaProveedor.pedidoReferencia.referencia.articulo',
            'referenciasProveedores.pedidoReferenciaProveedor.referencia', // Añadido para mostrar el código
            'referenciasProveedores.pedidoReferenciaProveedor.marca',
        ]);

        // Priorizar Heavymarket (siglas HM o ID 2)
        $empresa = Empresa::where('siglas', 'HM')->first() ?? Empresa::where('id', 2)->first() ?? Empresa::first();

        $pdf = Pdf::loadView('pdf.cotizacion', [
            'cotizacion' => $cotizacion,
            'empresa' => $empresa,
        ]);

        return $pdf;
    }

    /**
     * Finalizar el proceso de costeo y generar la cotización
     *
     * @param array $items Seleccionados (IDs de pedido_referencia_proveedor)
     */
    public function finalizarCosteo(Pedido $pedido, array $items, int $userId): Cotizacion
    {
        return DB::transaction(function () use ($pedido, $items, $userId) {
            // 1. Crear la cotización
            $cotizacion = Cotizacion::create([
                'pedido_id' => $pedido->id,
                'tercero_id' => $pedido->tercero_id,
                'user_id' => $userId,
                'estado' => 'Enviada', // O el estado inicial deseado
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(15),
            ]);

            // 2. Asociar los items seleccionados
            $total = 0;
            foreach ($items as $itemData) {
                CotizacionReferenciaProveedor::create([
                    'cotizacion_id' => $cotizacion->id,
                    'pedido_referencia_proveedor_id' => $itemData['id'],
                    'mostrar_referencia' => $itemData['mostrar_referencia'],
                ]);

                // Sumar al total (asumiendo que el precio ya está en el proveedor)
                $prov = \App\Models\PedidoReferenciaProveedor::find($itemData['id']);
                if ($prov) {
                    $total += $prov->valor_total;
                }
            }

            $cotizacion->update(['total' => $total]);

            // 3. Actualizar estado del pedido
            $pedido->update(['estado' => 'Cotizado']);

            return $cotizacion;
        });
    }
}
