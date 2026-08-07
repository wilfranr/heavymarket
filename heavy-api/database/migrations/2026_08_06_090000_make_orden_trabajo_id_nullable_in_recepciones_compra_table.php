<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recepciones_compra', function ($table) {
            $table->dropForeign('recepciones_compra_orden_trabajo_id_foreign');
        });

        DB::statement('ALTER TABLE recepciones_compra MODIFY orden_trabajo_id BIGINT UNSIGNED NULL');

        Schema::table('recepciones_compra', function ($table) {
            $table->foreign('orden_trabajo_id')->references('id')->on('orden_trabajos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('recepciones_compra', function ($table) {
            $table->dropForeign('recepciones_compra_orden_trabajo_id_foreign');
        });

        DB::statement('ALTER TABLE recepciones_compra MODIFY orden_trabajo_id BIGINT UNSIGNED NOT NULL');

        Schema::table('recepciones_compra', function ($table) {
            $table->foreign('orden_trabajo_id')->references('id')->on('orden_trabajos')->restrictOnDelete();
        });
    }
};
