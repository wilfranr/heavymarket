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
        Schema::table('pedido_referencia', function (Blueprint $table) {
            $table->unsignedBigInteger('categoria_comercial_id')->nullable()->after('lista_id');
            
            // Si quieres integridad referencial:
            // $table->foreign('categoria_comercial_id')->references('id')->on('listas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedido_referencia', function (Blueprint $table) {
            $table->dropColumn('categoria_comercial_id');
        });
    }
};
