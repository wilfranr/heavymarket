<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_compras', function (Blueprint $table): void {
            if (! Schema::hasColumn('orden_compras', 'transito_prorrogado_hasta')) {
                $table->date('transito_prorrogado_hasta')->nullable()->after('fecha_despacho');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orden_compras', function (Blueprint $table): void {
            if (Schema::hasColumn('orden_compras', 'transito_prorrogado_hasta')) {
                $table->dropColumn('transito_prorrogado_hasta');
            }
        });
    }
};
