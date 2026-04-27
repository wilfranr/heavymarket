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
        Schema::create('componentes_maquina', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maquina_id')->constrained('maquinas')->onDelete('cascade');
            $table->unsignedBigInteger('sistema_id')->nullable();
            $table->unsignedBigInteger('marca_id')->nullable();
            $table->string('modelo', 255)->nullable();
            $table->string('serie', 255)->nullable();
            $table->text('comentario')->nullable();
            $table->string('foto_placa', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('componentes_maquina');
    }
};
