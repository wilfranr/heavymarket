<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('direcciones', function (Blueprint $table) {
            if (! Schema::hasColumn('direcciones', 'correo')) {
                $table->string('correo')->nullable()->after('telefono');
            }
        });

        Schema::table('cotizaciones', function (Blueprint $table) {
            if (! Schema::hasColumn('cotizaciones', 'direccion_id')) {
                $table->foreignId('direccion_id')->nullable()->after('tercero_id')
                    ->constrained('direcciones')->nullOnDelete();
            }
        });

        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            if (! Schema::hasColumn('cotizacion_referencia_proveedores', 'cantidad_aprobada')) {
                $table->unsignedInteger('cantidad_aprobada')->nullable()->after('snapshot_cantidad');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            if (Schema::hasColumn('cotizacion_referencia_proveedores', 'cantidad_aprobada')) {
                $table->dropColumn('cantidad_aprobada');
            }
        });

        Schema::table('cotizaciones', function (Blueprint $table) {
            if (Schema::hasColumn('cotizaciones', 'direccion_id')) {
                $table->dropConstrainedForeignId('direccion_id');
            }
        });

        Schema::table('direcciones', function (Blueprint $table) {
            if (Schema::hasColumn('direcciones', 'correo')) {
                $table->dropColumn('correo');
            }
        });
    }
};
