<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_trabajos', function (Blueprint $table): void {
            if (! Schema::hasColumn('orden_trabajos', 'numero_factura')) {
                $table->string('numero_factura')->nullable()->after('motivo_cancelacion');
            }

            if (! Schema::hasColumn('orden_trabajos', 'factura_pdf')) {
                $table->string('factura_pdf')->nullable()->after('numero_factura');
            }

            if (! Schema::hasColumn('orden_trabajos', 'facturado_por')) {
                $table->unsignedBigInteger('facturado_por')->nullable()->after('factura_pdf');
            }

            if (! Schema::hasColumn('orden_trabajos', 'facturado_at')) {
                $table->timestamp('facturado_at')->nullable()->after('facturado_por');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orden_trabajos', function (Blueprint $table): void {
            $columnas = array_filter(
                ['numero_factura', 'factura_pdf', 'facturado_por', 'facturado_at'],
                fn (string $columna): bool => Schema::hasColumn('orden_trabajos', $columna)
            );

            if ($columnas !== []) {
                $table->dropColumn($columnas);
            }
        });
    }
};
