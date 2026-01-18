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
        Schema::create('categorias_landing', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion_general')->nullable();
            $table->timestamps();
        });

        Schema::create('subcategorias_landing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained('categorias_landing')->onDelete('cascade');
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subcategorias_landing');
        Schema::dropIfExists('categorias_landing');
    }
};
