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
        // Solo agregar si no existe (para compatibilidad con SQLite in-memory y MySQL)
        if (Schema::hasTable('listas') && ! Schema::hasColumn('listas', 'parent_id')) {
            Schema::table('listas', function (Blueprint $table) {
                $table->foreignId('parent_id')->nullable()->after('sistema_id')->constrained('listas')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listas', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
