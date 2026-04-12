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
        if (Schema::hasTable('referencias') && ! Schema::hasColumn('referencias', 'es_temporal')) {
            Schema::table('referencias', function (Blueprint $column) {
                $column->boolean('es_temporal')->default(false)->after('marca_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referencias', function (Blueprint $column) {
            $column->dropColumn('es_temporal');
        });
    }
};
