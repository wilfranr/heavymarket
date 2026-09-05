<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recepciones_compra', function ($table) {
            // Form de array de columnas (en vez del nombre del constraint):
            // portable entre MySQL y SQLite (usado en la suite de tests), que
            // no soporta dropForeign() por nombre.
            $table->dropForeign(['orden_trabajo_id']);
        });

        // MODIFY es sintaxis MySQL; SQLite (usado en la suite de tests) no la
        // soporta pero si soporta Blueprint::change() nativamente (sin dbal).
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE recepciones_compra MODIFY orden_trabajo_id BIGINT UNSIGNED NULL');
        } else {
            Schema::table('recepciones_compra', function ($table) {
                $table->unsignedBigInteger('orden_trabajo_id')->nullable()->change();
            });
        }

        Schema::table('recepciones_compra', function ($table) {
            $table->foreign('orden_trabajo_id')->references('id')->on('orden_trabajos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('recepciones_compra', function ($table) {
            // Form de array de columnas (en vez del nombre del constraint):
            // portable entre MySQL y SQLite (usado en la suite de tests), que
            // no soporta dropForeign() por nombre.
            $table->dropForeign(['orden_trabajo_id']);
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE recepciones_compra MODIFY orden_trabajo_id BIGINT UNSIGNED NOT NULL');
        } else {
            Schema::table('recepciones_compra', function ($table) {
                $table->unsignedBigInteger('orden_trabajo_id')->nullable(false)->change();
            });
        }

        Schema::table('recepciones_compra', function ($table) {
            $table->foreign('orden_trabajo_id')->references('id')->on('orden_trabajos')->restrictOnDelete();
        });
    }
};
