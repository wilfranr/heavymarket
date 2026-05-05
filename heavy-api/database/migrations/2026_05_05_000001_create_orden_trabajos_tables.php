<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para crear las tablas de Órdenes de Trabajo
 *
 * Tablas:
 * - orden_trabajos: Órdenes de trabajo generadas desde cotizaciones aprobadas
 * - orden_trabajo_referencias: Referencias asociadas a cada orden de trabajo
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabla principal de órdenes de trabajo
        if (! Schema::hasTable('orden_trabajos')) {
            Schema::create('orden_trabajos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('tercero_id')->nullable();
                $table->unsignedBigInteger('pedido_id')->nullable();
                $table->unsignedBigInteger('cotizacion_id')->nullable();
                $table->string('estado')->default('Pendiente');
                $table->date('fecha_ingreso')->nullable();
                $table->date('fecha_entrega')->nullable();
                $table->unsignedBigInteger('direccion_id')->nullable();
                $table->string('telefono')->nullable();
                $table->text('observaciones')->nullable();
                $table->string('guia')->nullable();
                $table->unsignedBigInteger('transportadora_id')->nullable();
                $table->string('archivo')->nullable();
                $table->string('motivo_cancelacion')->nullable();
                $table->timestamps();

                $table->index('estado');
                $table->index('tercero_id');
                $table->index('pedido_id');
                $table->index('cotizacion_id');
            });
        }

        // Tabla pivot de referencias de órdenes de trabajo
        if (! Schema::hasTable('orden_trabajo_referencias')) {
            Schema::create('orden_trabajo_referencias', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('orden_trabajo_id');
                $table->unsignedBigInteger('pedido_referencia_id')->nullable();
                $table->integer('cantidad')->default(1);
                $table->integer('cantidad_recibida')->default(0);
                $table->string('estado')->default('Pendiente');
                $table->boolean('recibido')->default(false);
                $table->date('fecha_recepcion')->nullable();
                $table->text('observaciones')->nullable();
                $table->timestamps();

                $table->index('orden_trabajo_id');
                $table->index('pedido_referencia_id');
                $table->index('estado');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orden_trabajo_referencias');
        Schema::dropIfExists('orden_trabajos');
    }
};