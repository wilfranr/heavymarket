<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Asegurar la existencia del rol Gerente Comercial
        Role::firstOrCreate(['name' => 'Gerente Comercial', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Contabilidad', 'guard_name' => 'web']);

        // 2. Columnas en orden_compras
        Schema::table('orden_compras', function (Blueprint $table) {
            if (! Schema::hasColumn('orden_compras', 'instrucciones_despacho')) {
                $table->text('instrucciones_despacho')->nullable()->after('observaciones');
            }
            if (! Schema::hasColumn('orden_compras', 'motivo_rechazo_gerencia')) {
                $table->text('motivo_rechazo_gerencia')->nullable()->after('instrucciones_despacho');
            }
            if (! Schema::hasColumn('orden_compras', 'aprobado_por_gerente_id')) {
                $table->foreignId('aprobado_por_gerente_id')
                    ->nullable()
                    ->after('motivo_rechazo_gerencia')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('orden_compras', 'fecha_aprobacion_gerencia')) {
                $table->timestamp('fecha_aprobacion_gerencia')->nullable()->after('aprobado_por_gerente_id');
            }
            if (! Schema::hasColumn('orden_compras', 'comprobante_pago_ruta')) {
                $table->string('comprobante_pago_ruta', 255)->nullable()->after('fecha_aprobacion_gerencia');
            }
            if (! Schema::hasColumn('orden_compras', 'fecha_pago')) {
                $table->timestamp('fecha_pago')->nullable()->after('comprobante_pago_ruta');
            }
            if (! Schema::hasColumn('orden_compras', 'pagado_por_id')) {
                $table->foreignId('pagado_por_id')
                    ->nullable()
                    ->after('fecha_pago')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('orden_compras', 'referencia_pago')) {
                $table->string('referencia_pago', 100)->nullable()->after('pagado_por_id');
            }
            if (! Schema::hasColumn('orden_compras', 'motivo_reembolso')) {
                $table->text('motivo_reembolso')->nullable()->after('referencia_pago');
            }
            if (! Schema::hasColumn('orden_compras', 'resolucion_novedad_tipo')) {
                $table->string('resolucion_novedad_tipo', 50)->nullable()->after('motivo_reembolso');
            }
            if (! Schema::hasColumn('orden_compras', 'resolucion_novedad_comentario')) {
                $table->text('resolucion_novedad_comentario')->nullable()->after('resolucion_novedad_tipo');
            }
            if (! Schema::hasColumn('orden_compras', 'resuelto_por_id')) {
                $table->foreignId('resuelto_por_id')
                    ->nullable()
                    ->after('resolucion_novedad_comentario')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('orden_compras', 'fecha_resolucion_novedad')) {
                $table->timestamp('fecha_resolucion_novedad')->nullable()->after('resuelto_por_id');
            }
        });

        // 3. Columnas en orden_compra_referencia para gestión de faltantes
        Schema::table('orden_compra_referencia', function (Blueprint $table) {
            if (! Schema::hasColumn('orden_compra_referencia', 'cantidad_original')) {
                $table->integer('cantidad_original')->nullable()->after('cantidad');
            }
            if (! Schema::hasColumn('orden_compra_referencia', 'motivo_faltante')) {
                $table->string('motivo_faltante', 255)->nullable()->after('cantidad_original');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orden_compra_referencia', function (Blueprint $table) {
            if (Schema::hasColumn('orden_compra_referencia', 'motivo_faltante')) {
                $table->dropColumn('motivo_faltante');
            }
            if (Schema::hasColumn('orden_compra_referencia', 'cantidad_original')) {
                $table->dropColumn('cantidad_original');
            }
        });

        Schema::table('orden_compras', function (Blueprint $table) {
            if (Schema::hasColumn('orden_compras', 'resuelto_por_id')) {
                $table->dropConstrainedForeignId('resuelto_por_id');
            }
            if (Schema::hasColumn('orden_compras', 'pagado_por_id')) {
                $table->dropConstrainedForeignId('pagado_por_id');
            }
            if (Schema::hasColumn('orden_compras', 'aprobado_por_gerente_id')) {
                $table->dropConstrainedForeignId('aprobado_por_gerente_id');
            }

            $columnsToDrop = [
                'instrucciones_despacho',
                'motivo_rechazo_gerencia',
                'fecha_aprobacion_gerencia',
                'comprobante_pago_ruta',
                'fecha_pago',
                'referencia_pago',
                'motivo_reembolso',
                'resolucion_novedad_tipo',
                'resolucion_novedad_comentario',
                'fecha_resolucion_novedad',
            ];

            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('orden_compras', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
