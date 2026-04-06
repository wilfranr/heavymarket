<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crea la tabla listas si no existe (necesario para tests con SQLite in-memory).
     * La tabla fue creada originalmente en SQL Server, no en migraciones Laravel.
     */
    public function up(): void
    {
        if (!Schema::hasTable('listas')) {
            Schema::create('listas', function (Blueprint $table) {
                $table->id();
                $table->string('tipo')->comment('Tipo de lista: Fabricantes, Tipo de Máquina, Sistema, etc.');
                $table->string('nombre')->comment('Nombre de la lista');
                $table->text('definicion')->nullable()->comment('Descripción o definición');
                $table->string('foto')->nullable()->comment('Ruta de foto/logo');
                $table->string('fotoMedida')->nullable()->comment('Medidas de la foto');
                $table->unsignedBigInteger('sistema_id')->nullable()->comment('Relación con sistemas');
                $table->unsignedBigInteger('parent_id')->nullable()->comment('Auto-referencia para jerarquías');
                $table->unsignedBigInteger('fabricante_id')->nullable()->comment('Relación con fabricantes (tabla obsoleta)');
                $table->timestamps();
                $table->softDeletes();

                // Índices
                $table->index('tipo');
                $table->index('nombre');
                $table->index('parent_id');
                $table->index('sistema_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No eliminamos la tabla en producción - es solo para tests
        if (app()->environment('testing')) {
            Schema::dropIfExists('listas');
        }
    }
};
