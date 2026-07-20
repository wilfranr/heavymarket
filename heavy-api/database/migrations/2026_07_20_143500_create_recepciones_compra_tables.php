<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('recepciones_compra')) {
            Schema::create('recepciones_compra', function (Blueprint $table) {
                $table->id();
                $table->foreignId('orden_trabajo_id')->constrained('orden_trabajos')->restrictOnDelete();
                $table->foreignId('orden_compra_id')->constrained('orden_compras')->restrictOnDelete();
                $table->foreignId('recibido_por')->constrained('users')->restrictOnDelete();
                $table->dateTime('fecha_recepcion');
                $table->string('numero_remision')->nullable();
                $table->text('observaciones')->nullable();
                $table->string('estado', 20)->default('Activa');
                $table->foreignId('anulada_por')->nullable()->constrained('users')->nullOnDelete();
                $table->dateTime('fecha_anulacion')->nullable();
                $table->text('motivo_anulacion')->nullable();
                $table->timestamps();

                $table->index('fecha_recepcion');
                $table->index('estado');
                $table->index(['orden_trabajo_id', 'orden_compra_id']);
            });
        }

        if (! Schema::hasTable('recepcion_compra_detalles')) {
            Schema::create('recepcion_compra_detalles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recepcion_compra_id')->constrained('recepciones_compra')->cascadeOnDelete();
                $table->foreignId('orden_compra_detalle_id')->constrained('orden_compra_referencia')->restrictOnDelete();
                $table->integer('cantidad_recibida');
                $table->integer('cantidad_conforme');
                $table->integer('cantidad_rechazada')->default(0);
                $table->text('motivo_rechazo')->nullable();
                $table->timestamps();

                $table->index('orden_compra_detalle_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recepcion_compra_detalles');
        Schema::dropIfExists('recepciones_compra');
    }
};
