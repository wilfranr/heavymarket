<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('listas') && !Schema::hasColumn('listas', 'fabricante_id')) {
            Schema::table('listas', function (Blueprint $table) {
                $table->foreignId('fabricante_id')->nullable()->after('parent_id')->constrained('fabricantes')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::table('listas', function (Blueprint $table) {
            $table->dropForeign(['fabricante_id']);
            $table->dropColumn('fabricante_id');
        });
    }
};
