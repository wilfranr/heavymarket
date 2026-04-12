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
        if (Schema::hasTable('maquinas') && ! Schema::hasColumn('maquinas', 'estado_revision')) {
            Schema::table('maquinas', function (Blueprint $table) {
                $table->enum('estado_revision', ['por_revisar', 'revisado'])
                    ->default('por_revisar')
                    ->after('fotoId')
                    ->comment('Estado de revisión de la máquina');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maquinas', function (Blueprint $table) {
            $table->dropColumn('estado_revision');
        });
    }
};
