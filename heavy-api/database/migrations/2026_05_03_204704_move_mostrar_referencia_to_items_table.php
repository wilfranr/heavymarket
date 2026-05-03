<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cotizaciones', function (Blueprint $table) {
            // $table->dropColumn('mostrar_referencia'); // Ya se ejecutó en el intento fallido anterior
        });

        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            $table->boolean('mostrar_referencia')->default(true)->after('pedido_referencia_proveedor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            $table->dropColumn('mostrar_referencia');
        });

        Schema::table('cotizaciones', function (Blueprint $table) {
            $table->boolean('mostrar_referencia')->default(true)->after('estado');
        });
    }
};
