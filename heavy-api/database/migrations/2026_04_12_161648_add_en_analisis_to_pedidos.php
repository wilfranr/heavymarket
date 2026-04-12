<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Solo ejecutar en MySQL (SQLite no soporta MODIFY COLUMN ni ENUM)
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pedidos MODIFY COLUMN estado ENUM('Nuevo','En_Analisis','Enviado','Entregado','Cancelado','Rechazado','Cotizado','En_Costeo','Aprobado') DEFAULT 'Nuevo'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Solo ejecutar en MySQL
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pedidos MODIFY COLUMN estado ENUM('Nuevo','Enviado','Entregado','Cancelado','Rechazado','Cotizado','En_Costeo','Aprobado') DEFAULT 'Nuevo'");
        }
    }
};
