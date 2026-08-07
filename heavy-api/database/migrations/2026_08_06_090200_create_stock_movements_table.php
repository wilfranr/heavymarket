<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referencia_id')->constrained('referencias')->restrictOnDelete();
            $table->unsignedInteger('cantidad');
            $table->string('tipo_movimiento', 10);
            $table->morphs('origen');
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->unique(['origen_type', 'origen_id', 'referencia_id'], 'stock_movements_origen_referencia_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
