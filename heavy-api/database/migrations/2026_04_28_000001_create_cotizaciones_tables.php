<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cotizaciones')) {
            Schema::create('cotizaciones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('tercero_id')->constrained()->onDelete('cascade');
                $table->foreignId('pedido_id')->constrained()->onDelete('cascade');
                $table->string('estado')->default('En_Proceso');
                $table->dateTime('fecha_emision')->nullable();
                $table->dateTime('fecha_vencimiento')->nullable();
                $table->text('observaciones')->nullable();
                $table->decimal('total', 15, 2)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('cotizacion_referencia_proveedores')) {
            Schema::create('cotizacion_referencia_proveedores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cotizacion_id')->constrained('cotizaciones')->onDelete('cascade');
                $table->foreignId('pedido_referencia_proveedor_id')
                    ->constrained('pedido_referencia_proveedor', indexName: 'cot_ref_prov_pedido_ref_prov_id_fk')
                    ->onDelete('cascade');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cotizacion_referencia_proveedores');
        Schema::dropIfExists('cotizaciones');
    }
};
