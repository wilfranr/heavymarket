<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedido_referencia_proveedor', function (Blueprint $table) {
            $table->boolean('es_backorder')->default(false)->after('dias_entrega');
        });
    }

    public function down(): void
    {
        Schema::table('pedido_referencia_proveedor', function (Blueprint $table) {
            $table->dropColumn('es_backorder');
        });
    }
};
