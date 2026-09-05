<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_trabajo_referencias', function (Blueprint $table): void {
            if (! Schema::hasColumn('orden_trabajo_referencias', 'cantidad_depurada')) {
                $table->integer('cantidad_depurada')->default(0)->after('cantidad_recibida');
            }

            if (! Schema::hasColumn('orden_trabajo_referencias', 'motivo_depuracion')) {
                $table->text('motivo_depuracion')->nullable()->after('cantidad_depurada');
            }

            if (! Schema::hasColumn('orden_trabajo_referencias', 'depurado_por')) {
                $table->unsignedBigInteger('depurado_por')->nullable()->after('motivo_depuracion');
            }

            if (! Schema::hasColumn('orden_trabajo_referencias', 'depurado_at')) {
                $table->timestamp('depurado_at')->nullable()->after('depurado_por');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orden_trabajo_referencias', function (Blueprint $table): void {
            $columnas = array_filter(
                ['cantidad_depurada', 'motivo_depuracion', 'depurado_por', 'depurado_at'],
                fn (string $columna): bool => Schema::hasColumn('orden_trabajo_referencias', $columna)
            );

            if ($columnas !== []) {
                $table->dropColumn($columnas);
            }
        });
    }
};
