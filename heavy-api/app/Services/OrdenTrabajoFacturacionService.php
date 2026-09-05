<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrdenTrabajoEstado;
use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cierre comercial de la Orden de Trabajo: HeavyMarket no reemplaza el
 * software contable, solo registra el numero de factura ya emitido
 * externamente y cierra la OT.
 */
class OrdenTrabajoFacturacionService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function facturar(OrdenTrabajo $ordenTrabajo, array $data, User $usuario): OrdenTrabajo
    {
        return DB::transaction(function () use ($ordenTrabajo, $data, $usuario): OrdenTrabajo {
            if ($ordenTrabajo->estado !== OrdenTrabajoEstado::ListaParaFacturar->value) {
                throw ValidationException::withMessages([
                    'orden_trabajo' => 'La orden de trabajo debe estar en estado "Lista para Facturar" para poder facturarse.',
                ]);
            }

            $rutaPdf = null;
            $archivo = $data['factura_pdf'] ?? null;

            if ($archivo instanceof UploadedFile) {
                $rutaPdf = $archivo->store("facturas/{$ordenTrabajo->id}", 'public');
            }

            $ordenTrabajo->update([
                'estado' => OrdenTrabajoEstado::Cerrada->value,
                'numero_factura' => $data['numero_factura'],
                'factura_pdf' => $rutaPdf,
                'facturado_por' => $usuario->id,
                'facturado_at' => now(),
            ]);

            return $ordenTrabajo->refresh();
        });
    }

    /**
     * Resumen de lo facturable: excluye del total lo que corresponde a
     * cantidad_depurada (no se le cobra al cliente lo que no llego y fue
     * depurado como faltante definitivo).
     *
     * @return array{lineas: array<int, array<string, mixed>>, total: float}
     */
    public function resumenFacturable(OrdenTrabajo $ordenTrabajo): array
    {
        $ordenTrabajo->loadMissing(['referencias.pedidoReferencia.proveedores', 'referencias.referencia']);

        $lineas = $ordenTrabajo->referencias->map(function (OrdenTrabajoReferencia $referencia): array {
            $proveedores = $referencia->pedidoReferencia?->proveedores ?? collect();
            $proveedorAprobado = $proveedores->first(fn ($proveedor): bool => (int) $proveedor->estado === 1) ?? $proveedores->first();

            $precioUnitario = (float) ($proveedorAprobado->valor_unidad ?? 0);
            $cantidadFacturable = (int) $referencia->cantidad_recibida;

            return [
                'referencia_id' => $referencia->id,
                'referencia' => $referencia->pedidoReferencia?->referencia?->referencia
                    ?? $referencia->referencia?->referencia,
                'cantidad_cotizada' => (int) $referencia->cantidad_cotizada,
                'cantidad_depurada' => (int) $referencia->cantidad_depurada,
                'cantidad_facturable' => $cantidadFacturable,
                'precio_unitario' => $precioUnitario,
                'subtotal' => round($precioUnitario * $cantidadFacturable, 2),
            ];
        })->values();

        return [
            'lineas' => $lineas->all(),
            'total' => round((float) $lineas->sum('subtotal'), 2),
        ];
    }
}
