<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Cotizacion;
use App\Models\CotizacionReferenciaProveedor;
use App\Models\Empresa;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraReferencia;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Pedido;
use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaProveedor;
use App\Models\TRM;
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
     *
     * Al aprobar se crean automáticamente:
     * - Orden de Trabajo
     * - Orden de Compra (con referencias de proveedores)
     */
    public function aprobar(Cotizacion $cotizacion): Cotizacion
    {
        return DB::transaction(function () use ($cotizacion) {
            // 1. Actualizar estado de cotización
            $cotizacion->update(['estado' => 'Aprobada']);

            // 2. Actualizar estado del pedido asociado
            if ($cotizacion->pedido) {
                $cotizacion->pedido->update(['estado' => 'Cotizado']);
            }

            // 3. Crear Orden de Trabajo
            $this->crearOrdenTrabajo($cotizacion);

            // 4. Crear Orden de Compra
            $this->crearOrdenCompra($cotizacion);

            return $cotizacion->fresh(['pedido', 'tercero', 'user']);
        });
    }

    /**
     * Crear Orden de Trabajo a partir de cotización aprobada
     */
    private function crearOrdenTrabajo(Cotizacion $cotizacion): void
    {
        $pedido = $cotizacion->pedido;

        $ordenTrabajo = OrdenTrabajo::create([
            'user_id' => auth()->id(),
            'tercero_id' => $cotizacion->tercero_id,
            'pedido_id' => $pedido?->id,
            'cotizacion_id' => $cotizacion->id,
            'estado' => 'Pendiente',
            'fecha_ingreso' => now(),
            'fecha_entrega' => null,
            'telefono' => null,
            'observaciones' => "Generada automáticamente desde cotización #{$cotizacion->id}",
            'guia' => null,
            'transportadora_id' => null,
            'archivo' => null,
            'motivo_cancelacion' => null,
        ]);

        // Copiar referencias de la cotizacion a la orden de trabajo
        foreach ($cotizacion->referenciasProveedores as $item) {
            $prp = $item->pedidoReferenciaProveedor;
            if (! $prp) {
                continue;
            }

            // Buscar o crear el PedidoReferencia asociado
            $pedidoReferencia = PedidoReferencia::where('pedido_id', $pedido?->id)
                ->where('referencia_id', $prp->referencia_id)
                ->first();

            if ($pedidoReferencia) {
                OrdenTrabajoReferencia::create([
                    'orden_trabajo_id' => $ordenTrabajo->id,
                    'pedido_referencia_id' => $pedidoReferencia->id,
                    'cantidad' => $prp->cantidad,
                    'cantidad_recibida' => 0,
                    'estado' => 'Pendiente',
                    'recibido' => false,
                ]);
            }
        }
    }

    /**
     * Crear Orden de Compra a partir de cotización aprobada
     */
    private function crearOrdenCompra(Cotizacion $cotizacion): void
    {
        $pedido = $cotizacion->pedido;

        // Agrupar referencias por proveedor
        $proveedores = [];
        foreach ($cotizacion->referenciasProveedores as $item) {
            $prp = $item->pedidoReferenciaProveedor;
            if (! $prp) {
                continue;
            }

            $proveedorId = $prp->tercero_id ?? null;
            if (! $proveedorId) {
                continue;
            }

            if (! isset($proveedores[$proveedorId])) {
                $proveedores[$proveedorId] = [];
            }

            $proveedores[$proveedorId][] = [
                'referencia_id' => $prp->referencia_id,
                'cantidad' => $prp->cantidad,
                'valor_unitario' => $prp->precio_unitario,
                'valor_total' => $prp->valor_total ?? ($prp->cantidad * $prp->precio_unitario),
            ];
        }

        // Crear una orden de compra por cada proveedor
        foreach ($proveedores as $proveedorId => $referencias) {
            $ordenCompra = OrdenCompra::create([
                'tercero_id' => $cotizacion->tercero_id,
                'pedido_id' => $pedido?->id,
                'cotizacion_id' => $cotizacion->id,
                'proveedor_id' => $proveedorId,
                'estado' => 'Pendiente',
                'fecha_expedicion' => now(),
                'fecha_entrega' => null,
                'observaciones' => "Generada automáticamente desde cotización #{$cotizacion->id}",
                'direccion' => null,
                'telefono' => null,
                'guia' => null,
                'color' => '#FFFF00',
            ]);

            foreach ($referencias as $ref) {
                OrdenCompraReferencia::create([
                    'orden_compra_id' => $ordenCompra->id,
                    'referencia_id' => $ref['referencia_id'],
                    'cantidad' => $ref['cantidad'],
                    'valor_unitario' => $ref['valor_unitario'],
                    'valor_total' => $ref['valor_total'],
                ]);
            }

            // Recalcular total
            $valorTotal = $ordenCompra->getTotalReferencias();
            $ordenCompra->update(['valor_total' => $valorTotal]);
        }
    }

    /**
     * Rechazar cotización
     */
    public function rechazar(Cotizacion $cotizacion, string $motivo = ''): Cotizacion
    {
        $cotizacion->update([
            'estado' => 'Rechazada',
            'observaciones' => $motivo ? trim(($cotizacion->observaciones ?: '')."\nRechazo: ".$motivo) : $cotizacion->observaciones,
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
     * Generar PDF de la orden de trabajo
     */
    public function generarPDFOrdenTrabajo(OrdenTrabajo $ordenTrabajo)
    {
        $ordenTrabajo->load([
            'tercero.city',
            'pedido.maquina',
            'cotizacion.user',
            'transportadora',
            'direccion',
            'referencias.pedidoReferencia.referencia.articulo',
            'referencias.pedidoReferencia.referencia.marca',
        ]);

        // Priorizar Heavymarket (siglas HM o ID 2)
        $empresa = Empresa::where('siglas', 'HM')->first() ?? Empresa::where('id', 2)->first() ?? Empresa::first();

        $pdf = Pdf::loadView('pdf.orden_trabajo', [
            'ordenTrabajo' => $ordenTrabajo,
            'empresa' => $empresa,
        ]);

        return $pdf;
    }

    /**
     * Finalizar el proceso de costeo y generar la cotización
     *
     * @param  array  $items  Seleccionados (IDs de pedido_referencia_proveedor)
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
                $prov = PedidoReferenciaProveedor::find($itemData['id']);
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
