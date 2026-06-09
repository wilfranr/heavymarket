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
        // Desactivamos restricciones de FK para poder limpiar la tabla
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('cotizacion_referencia_proveedores');
        Schema::dropIfExists('cotizaciones');

        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('tercero_id');
            $table->unsignedBigInteger('pedido_id');
            $table->string('estado')->default('En_Proceso');
            $table->dateTime('fecha_emision')->nullable();
            $table->dateTime('fecha_vencimiento')->nullable();
            $table->text('observaciones')->nullable();
            $table->decimal('total', 15, 2)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('tercero_id')->references('id')->on('terceros')->onDelete('cascade');
            $table->foreign('pedido_id')->references('id')->on('pedidos')->onDelete('cascade');
        });

        Schema::create('cotizacion_referencia_proveedores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cotizacion_id');
            $table->unsignedBigInteger('pedido_referencia_proveedor_id');
            $table->timestamps();

            $table->foreign('cotizacion_id', 'fk_crp_cot')->references('id')->on('cotizaciones')->onDelete('cascade');
            $table->foreign('pedido_referencia_proveedor_id', 'fk_crp_prp')->references('id')->on('pedido_referencia_proveedor')->onDelete('cascade');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('cotizacion_referencia_proveedores');
        Schema::dropIfExists('cotizaciones');
        Schema::enableForeignKeyConstraints();
    }
};
