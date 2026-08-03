<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            if (! Schema::hasColumn('cotizacion_referencia_proveedores', 'estado_aprobacion')) {
                $table->string('estado_aprobacion', 20)->default('Pendiente')->after('snapshot_valor_total');
            }

            if (! Schema::hasColumn('cotizacion_referencia_proveedores', 'fecha_aprobacion')) {
                $table->timestamp('fecha_aprobacion')->nullable()->after('estado_aprobacion');
            }
        });

        DB::table('cotizacion_referencia_proveedores')
            ->join('cotizaciones', 'cotizaciones.id', '=', 'cotizacion_referencia_proveedores.cotizacion_id')
            ->where('cotizaciones.estado', 'Aprobada')
            ->update([
                'cotizacion_referencia_proveedores.estado_aprobacion' => 'Aprobada',
                'cotizacion_referencia_proveedores.fecha_aprobacion' => DB::raw('COALESCE(cotizaciones.updated_at, cotizacion_referencia_proveedores.updated_at)'),
            ]);

        DB::table('cotizacion_referencia_proveedores')
            ->join('cotizaciones', 'cotizaciones.id', '=', 'cotizacion_referencia_proveedores.cotizacion_id')
            ->whereIn('cotizaciones.estado', ['Rechazada', 'Anulada'])
            ->update([
                'cotizacion_referencia_proveedores.estado_aprobacion' => 'Rechazada',
            ]);
    }

    public function down(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            if (Schema::hasColumn('cotizacion_referencia_proveedores', 'fecha_aprobacion')) {
                $table->dropColumn('fecha_aprobacion');
            }

            if (Schema::hasColumn('cotizacion_referencia_proveedores', 'estado_aprobacion')) {
                $table->dropColumn('estado_aprobacion');
            }
        });
    }
};
