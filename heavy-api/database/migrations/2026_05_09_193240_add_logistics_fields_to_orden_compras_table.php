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
        Schema::table('orden_compras', function (Blueprint $table) {
            $table->unsignedBigInteger('transportadora_id')->nullable()->after('guia');
            $table->date('fecha_despacho')->nullable()->after('fecha_expedicion');

            // Si la tabla transportadoras existe, añadir FK
            if (Schema::hasTable('transportadoras')) {
                $table->foreign('transportadora_id')->references('id')->on('transportadoras')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orden_compras', function (Blueprint $table) {
            $table->dropForeign(['transportadora_id']);
            $table->dropColumn(['transportadora_id', 'fecha_despacho']);
        });
    }
};
