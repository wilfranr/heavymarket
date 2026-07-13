<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            $table->string('snapshot_referencia')->nullable()->after('mostrar_referencia');
            $table->text('snapshot_descripcion')->nullable()->after('snapshot_referencia');
            $table->unsignedBigInteger('snapshot_marca_id')->nullable()->after('snapshot_descripcion');
            $table->string('snapshot_marca')->nullable()->after('snapshot_marca_id');
            $table->unsignedBigInteger('snapshot_proveedor_id')->nullable()->after('snapshot_marca');
            $table->string('snapshot_proveedor_nombre')->nullable()->after('snapshot_proveedor_id');
            $table->string('snapshot_entrega')->nullable()->after('snapshot_proveedor_nombre');
            $table->unsignedInteger('snapshot_cantidad')->nullable()->after('snapshot_entrega');
            $table->decimal('snapshot_valor_unidad', 15, 2)->nullable()->after('snapshot_cantidad');
            $table->decimal('snapshot_valor_total', 15, 2)->nullable()->after('snapshot_valor_unidad');
        });
    }

    public function down(): void
    {
        Schema::table('cotizacion_referencia_proveedores', function (Blueprint $table) {
            $table->dropColumn([
                'snapshot_referencia',
                'snapshot_descripcion',
                'snapshot_marca_id',
                'snapshot_marca',
                'snapshot_proveedor_id',
                'snapshot_proveedor_nombre',
                'snapshot_entrega',
                'snapshot_cantidad',
                'snapshot_valor_unidad',
                'snapshot_valor_total',
            ]);
        });
    }
};
