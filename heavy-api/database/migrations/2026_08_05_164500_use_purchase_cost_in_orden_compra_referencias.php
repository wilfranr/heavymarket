<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cotizacion_referencia_proveedores', 'snapshot_costo_unidad')) {
            Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table): void {
                $table->decimal('snapshot_costo_unidad', 15, 2)
                    ->nullable()
                    ->after('snapshot_cantidad');
            });
        }

        $this->backfillSnapshotCostos();
        $this->migrarOrdenesCompraACosto();
    }

    public function down(): void
    {
        $this->restaurarOrdenesCompraAPrecioVenta();

        if (Schema::hasColumn('cotizacion_referencia_proveedores', 'snapshot_costo_unidad')) {
            Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table): void {
                $table->dropColumn('snapshot_costo_unidad');
            });
        }
    }

    private function backfillSnapshotCostos(): void
    {
        DB::table('cotizacion_referencia_proveedores as crp')
            ->join(
                'pedido_referencia_proveedor as prp',
                'prp.id',
                '=',
                'crp.pedido_referencia_proveedor_id'
            )
            ->whereNull('crp.snapshot_costo_unidad')
            ->select(['crp.id as id', 'prp.costo_unidad'])
            ->orderBy('crp.id')
            ->chunkById(500, function ($items): void {
                foreach ($items as $item) {
                    DB::table('cotizacion_referencia_proveedores')
                        ->where('id', $item->id)
                        ->update(['snapshot_costo_unidad' => $item->costo_unidad]);
                }
            }, 'crp.id', 'id');
    }

    private function migrarOrdenesCompraACosto(): void
    {
        $ordenesAfectadas = [];

        $this->lineasAutomaticas()
            ->select([
                'ocr.id as id',
                'ocr.orden_compra_id',
                'ocr.cantidad',
                'ocr.valor_unitario',
                'crp.snapshot_costo_unidad',
                'crp.snapshot_valor_unidad',
                'prp.costo_unidad',
                'prp.valor_unidad',
            ])
            ->orderBy('ocr.id')
            ->chunkById(500, function ($lineas) use (&$ordenesAfectadas): void {
                foreach ($lineas as $linea) {
                    $valorActual = (float) $linea->valor_unitario;
                    $precioSnapshot = $linea->snapshot_valor_unidad !== null
                        ? (float) $linea->snapshot_valor_unidad
                        : null;
                    $precioActual = $linea->valor_unidad !== null
                        ? (float) $linea->valor_unidad
                        : null;

                    if (! $this->coincideConAlguno($valorActual, [$precioSnapshot, $precioActual])) {
                        continue;
                    }

                    $costo = (float) ($linea->snapshot_costo_unidad ?? $linea->costo_unidad ?? 0);
                    $cantidad = (int) $linea->cantidad;

                    DB::table('orden_compra_referencia')
                        ->where('id', $linea->id)
                        ->update([
                            'valor_unitario' => $costo,
                            'valor_total' => $cantidad * $costo,
                        ]);

                    $ordenesAfectadas[(int) $linea->orden_compra_id] = true;
                }
            }, 'ocr.id', 'id');

        $this->recalcularTotales(array_keys($ordenesAfectadas));
    }

    private function restaurarOrdenesCompraAPrecioVenta(): void
    {
        $ordenesAfectadas = [];

        $this->lineasAutomaticas()
            ->select([
                'ocr.id as id',
                'ocr.orden_compra_id',
                'ocr.cantidad',
                'ocr.valor_unitario',
                'crp.snapshot_costo_unidad',
                'crp.snapshot_valor_unidad',
                'prp.costo_unidad',
                'prp.valor_unidad',
            ])
            ->orderBy('ocr.id')
            ->chunkById(500, function ($lineas) use (&$ordenesAfectadas): void {
                foreach ($lineas as $linea) {
                    $valorActual = (float) $linea->valor_unitario;
                    $costoSnapshot = $linea->snapshot_costo_unidad !== null
                        ? (float) $linea->snapshot_costo_unidad
                        : null;
                    $costoActual = $linea->costo_unidad !== null
                        ? (float) $linea->costo_unidad
                        : null;

                    if (! $this->coincideConAlguno($valorActual, [$costoSnapshot, $costoActual])) {
                        continue;
                    }

                    $precioVenta = (float) ($linea->snapshot_valor_unidad ?? $linea->valor_unidad ?? 0);
                    $cantidad = (int) $linea->cantidad;

                    DB::table('orden_compra_referencia')
                        ->where('id', $linea->id)
                        ->update([
                            'valor_unitario' => $precioVenta,
                            'valor_total' => $cantidad * $precioVenta,
                        ]);

                    $ordenesAfectadas[(int) $linea->orden_compra_id] = true;
                }
            }, 'ocr.id', 'id');

        $this->recalcularTotales(array_keys($ordenesAfectadas));
    }

    private function lineasAutomaticas()
    {
        return DB::table('orden_compra_referencia as ocr')
            ->join('orden_compras as oc', 'oc.id', '=', 'ocr.orden_compra_id')
            ->join(
                'cotizacion_referencia_proveedores as crp',
                'crp.cotizacion_id',
                '=',
                'oc.cotizacion_id'
            )
            ->join(
                'pedido_referencia_proveedor as prp',
                'prp.id',
                '=',
                'crp.pedido_referencia_proveedor_id'
            )
            ->leftJoin(
                'pedido_referencia as pr',
                'pr.id',
                '=',
                'prp.pedido_referencia_id'
            )
            ->whereNotNull('oc.cotizacion_id')
            ->where('oc.observaciones', 'like', 'Generada automáticamente desde cotización #%')
            ->where('crp.estado_aprobacion', 'Aprobada')
            ->whereColumn('prp.proveedor_id', 'oc.proveedor_id')
            ->whereRaw('COALESCE(prp.referencia_id, pr.referencia_id) = ocr.referencia_id');
    }

    /**
     * @param  array<int, float|null>  $candidatos
     */
    private function coincideConAlguno(float $valor, array $candidatos): bool
    {
        foreach ($candidatos as $candidato) {
            if ($candidato !== null && abs($valor - $candidato) < 0.01) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, int>  $ordenIds
     */
    private function recalcularTotales(array $ordenIds): void
    {
        foreach ($ordenIds as $ordenId) {
            $total = DB::table('orden_compra_referencia')
                ->where('orden_compra_id', $ordenId)
                ->sum('valor_total');

            DB::table('orden_compras')
                ->where('id', $ordenId)
                ->update(['valor_total' => $total]);
        }
    }
};
