<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('analysis_commercial_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pedido_referencia_id');
            $table->unsignedBigInteger('categoria_comercial_id');
            $table->timestamps();

            $table->foreign('pedido_referencia_id', 'fk_acc_pedido_referencia')
                ->references('id')
                ->on('pedido_referencia')
                ->onDelete('cascade');

            $table->foreign('categoria_comercial_id', 'fk_acc_categoria_comercial')
                ->references('id')
                ->on('listas')
                ->onDelete('cascade');

            $table->unique(['pedido_referencia_id', 'categoria_comercial_id'], 'uq_acc_pedido_ref_cat');
        });

        // Migrar datos existentes de pedido_referencia.categoria_comercial_id a la nueva tabla pivote
        $existentes = DB::table('pedido_referencia')
            ->whereNotNull('categoria_comercial_id')
            ->select('id', 'categoria_comercial_id', 'created_at', 'updated_at')
            ->get();

        foreach ($existentes as $registro) {
            DB::table('analysis_commercial_categories')->insert([
                'pedido_referencia_id' => $registro->id,
                'categoria_comercial_id' => $registro->categoria_comercial_id,
                'created_at' => $registro->created_at ?? now(),
                'updated_at' => $registro->updated_at ?? now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analysis_commercial_categories');
    }
};
