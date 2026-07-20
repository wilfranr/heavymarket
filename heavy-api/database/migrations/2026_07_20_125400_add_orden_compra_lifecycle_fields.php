<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orden_compras')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                if (! Schema::hasColumn('orden_compras', 'fecha_envio')) {
                    $table->dateTime('fecha_envio')->nullable()->after('fecha_expedicion');
                }

                if (! Schema::hasColumn('orden_compras', 'fecha_confirmacion')) {
                    $table->dateTime('fecha_confirmacion')->nullable()->after('fecha_envio');
                }

                if (! Schema::hasColumn('orden_compras', 'fecha_recepcion')) {
                    $table->dateTime('fecha_recepcion')->nullable()->after('fecha_confirmacion');
                }

                if (! Schema::hasColumn('orden_compras', 'motivo_cancelacion')) {
                    $table->text('motivo_cancelacion')->nullable()->after('observaciones');
                }

                if (! Schema::hasColumn('orden_compras', 'notas_cierre')) {
                    $table->text('notas_cierre')->nullable()->after('motivo_cancelacion');
                }
            });

            DB::table('orden_compras')->where('estado', 'Cancelado')->update([
                'estado' => 'Cancelada',
                'color' => '#ff0000',
            ]);

            DB::table('orden_compras')->where('estado', 'Entregado')->update([
                'estado' => 'Recibida',
                'color' => '#00ff00',
            ]);

            DB::table('orden_compras')->whereIn('estado', ['En proceso', 'Despachado'])->update([
                'estado' => 'Confirmada',
                'color' => '#8BC34A',
            ]);

            DB::table('orden_compras')
                ->where('estado', 'Pendiente')
                ->where('created_at', '>=', now()->subDays(30))
                ->update([
                    'estado' => 'Pendiente de envío',
                    'color' => '#FFFF00',
                ]);

            DB::table('orden_compras')->where('estado', 'Borrador')->update([
                'estado' => 'Pendiente de envío',
                'color' => '#FFFF00',
            ]);

            DB::table('orden_compras')
                ->where('estado', 'Pendiente')
                ->update([
                    'estado' => 'Confirmada',
                    'color' => '#8BC34A',
                ]);
        }

        if (Schema::hasTable('orden_compra_referencia') && ! Schema::hasColumn('orden_compra_referencia', 'cantidad_recibida')) {
            Schema::table('orden_compra_referencia', function (Blueprint $table) {
                $table->integer('cantidad_recibida')->default(0)->after('cantidad');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orden_compra_referencia') && Schema::hasColumn('orden_compra_referencia', 'cantidad_recibida')) {
            Schema::table('orden_compra_referencia', function (Blueprint $table) {
                $table->dropColumn('cantidad_recibida');
            });
        }

        if (Schema::hasTable('orden_compras')) {
            $columns = array_values(array_filter([
                Schema::hasColumn('orden_compras', 'fecha_envio') ? 'fecha_envio' : null,
                Schema::hasColumn('orden_compras', 'fecha_confirmacion') ? 'fecha_confirmacion' : null,
                Schema::hasColumn('orden_compras', 'fecha_recepcion') ? 'fecha_recepcion' : null,
                Schema::hasColumn('orden_compras', 'motivo_cancelacion') ? 'motivo_cancelacion' : null,
                Schema::hasColumn('orden_compras', 'notas_cierre') ? 'notas_cierre' : null,
            ]));

            if ($columns !== []) {
                Schema::table('orden_compras', function (Blueprint $table) use ($columns) {
                    $table->dropColumn($columns);
                });
            }
        }
    }
};
