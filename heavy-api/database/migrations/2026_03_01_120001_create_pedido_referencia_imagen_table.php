<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Múltiples imágenes por ítem del pedido (cliente en cotizar, asesor al crear/editar, analista al enviar a costeo).
     */
    public function up(): void
    {
        Schema::create('pedido_referencia_imagen', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pedido_referencia_id');
            $table->string('imagen'); // path en storage o URL
            $table->string('origen', 50)->default('cliente'); // cliente, asesor, costeo
            $table->timestamps();

            $table->foreign('pedido_referencia_id')->references('id')->on('pedido_referencia')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pedido_referencia_imagen');
    }
};
