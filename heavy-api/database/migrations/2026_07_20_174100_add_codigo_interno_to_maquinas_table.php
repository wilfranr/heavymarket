<?php

declare(strict_types=1);

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
        if (! Schema::hasColumn('maquinas', 'codigo_interno')) {
            Schema::table('maquinas', function (Blueprint $table) {
                $table->string('codigo_interno', 100)->nullable()->unique()->after('fabricante_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('maquinas', 'codigo_interno')) {
            Schema::table('maquinas', function (Blueprint $table) {
                $table->dropUnique(['codigo_interno']);
                $table->dropColumn('codigo_interno');
            });
        }
    }
};
