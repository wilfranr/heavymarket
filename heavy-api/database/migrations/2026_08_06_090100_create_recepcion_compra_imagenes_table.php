<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recepcion_compra_imagenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcion_compra_id')->constrained('recepciones_compra')->cascadeOnDelete();
            $table->string('ruta');
            $table->string('nombre_original');
            $table->string('mime');
            $table->unsignedInteger('size');
            $table->string('tipo', 10)->default('foto');
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('recepcion_compra_id');
            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recepcion_compra_imagenes');
    }
};
