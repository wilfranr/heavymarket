<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }
        DB::statement("ALTER TABLE pedidos MODIFY COLUMN estado ENUM('Borrador','Nuevo','En_Analisis','Enviado','Entregado','Cancelado','Rechazado','Cotizado','En_Costeo','Aprobado') DEFAULT 'Nuevo'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }
        DB::statement("ALTER TABLE pedidos MODIFY COLUMN estado ENUM('Nuevo','En_Analisis','Enviado','Entregado','Cancelado','Rechazado','Cotizado','En_Costeo','Aprobado') DEFAULT 'Nuevo'");
    }
};
