<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orden_compra_referencia')) {
            Schema::create('orden_compra_referencia', function (Blueprint $table) {
                $table->id();
                $table->foreignId('orden_compra_id')->constrained('orden_compras')->cascadeOnDelete();
                $table->foreignId('referencia_id')->constrained('referencias')->restrictOnDelete();
                $table->integer('cantidad')->default(1);
                $table->integer('cantidad_recibida')->default(0);
                $table->decimal('valor_unitario', 15, 2)->default(0);
                $table->decimal('valor_total', 15, 2)->default(0);
                $table->timestamps();

                $table->index('orden_compra_id', 'idx_ocr_orden_compra_id');
                $table->index('referencia_id', 'idx_ocr_referencia_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('orden_compra_referencia');
    }
};
