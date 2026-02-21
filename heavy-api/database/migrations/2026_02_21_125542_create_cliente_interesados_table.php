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
        Schema::create('cliente_interesados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo');
            $table->string('empresa')->nullable();
            $table->string('correo_electronico');
            $table->string('telefono')->nullable();
            $table->text('motivo_consulta');
            $table->boolean('acepta_tratamiento_datos')->default(true);
            $table->string('estado')->default('nuevo'); // nuevo, contactado, descartado
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente_interesados');
    }
};
