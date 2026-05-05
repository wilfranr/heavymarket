<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_compras', function (Blueprint $table) {
            $table->string('direccion', 255)->nullable()->change();
            $table->string('telefono', 50)->nullable()->change();
            $table->date('fecha_expedicion')->nullable()->change();
            $table->date('fecha_entrega')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('orden_compras', function (Blueprint $table) {
            $table->string('direccion', 255)->nullable(false)->change();
            $table->string('telefono', 50)->nullable(false)->change();
            $table->date('fecha_expedicion')->nullable(false)->change();
            $table->date('fecha_entrega')->nullable(false)->change();
        });
    }
};
