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
        Schema::table('subcategorias_landing', function (Blueprint $table) {
            $table->boolean('mostrar_en_navbar')->default(false)->after('descripcion');
            $table->integer('orden_navbar')->nullable()->after('mostrar_en_navbar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subcategorias_landing', function (Blueprint $table) {
            $table->dropColumn(['mostrar_en_navbar', 'orden_navbar']);
        });
    }
};
