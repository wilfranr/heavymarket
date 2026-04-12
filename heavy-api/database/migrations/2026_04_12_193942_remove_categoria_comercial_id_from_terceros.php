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
        Schema::table('terceros', function (Blueprint $table) {
            $table->dropForeign(['categoria_comercial_id']);
            $table->dropColumn('categoria_comercial_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terceros', function (Blueprint $table) {
            $table->unsignedBigInteger('categoria_comercial_id')->nullable();
            $table->foreign('categoria_comercial_id')->references('id')->on('listas')->onDelete('set null');
        });
    }
};
