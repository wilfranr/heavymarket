<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tipo de artículo en pedidos es una Lista (tipo = 'Tipo de Artículo') relacionada con el sistema.
     */
    public function up(): void
    {
        Schema::table('pedido_referencia', function (Blueprint $table) {
            $table->unsignedBigInteger('lista_id')->nullable()->after('sistema_id');
            $table->foreign('lista_id')->references('id')->on('listas')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedido_referencia', function (Blueprint $table) {
            $table->dropForeign(['lista_id']);
            $table->dropColumn('lista_id');
        });
    }
};
