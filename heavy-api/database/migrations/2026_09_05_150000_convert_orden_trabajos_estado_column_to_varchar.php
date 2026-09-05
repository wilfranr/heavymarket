<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * En este entorno, orden_trabajos.estado quedo como un ENUM legacy
 * ('Pendiente','En Proceso','Completado','Cancelado') de un esquema anterior
 * a 2026_05_05_000001_create_orden_trabajos_tables.php (que ya declara la
 * columna como string, pero Schema::create() no se ejecuta si la tabla ya
 * existe). App\Enums\OrdenTrabajoEstado introduce 'Lista para Facturar' y
 * 'Cerrada', que MySQL trunca silenciosamente (warning 1265) al no estar en
 * la lista del ENUM. Se convierte la columna a VARCHAR(255) sin tocar los
 * datos existentes (ningun registro legacy en 'Completado' en este entorno).
 */
return new class extends Migration
{
    public function up(): void
    {
        // MODIFY es sintaxis MySQL; en SQLite (usado en la suite de tests) la
        // columna ya nace sin el ENUM legacy via Schema::create(), no aplica.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orden_trabajos MODIFY estado VARCHAR(255) NOT NULL DEFAULT 'Pendiente'");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orden_trabajos MODIFY estado ENUM('Pendiente','En Proceso','Completado','Cancelado') NOT NULL DEFAULT 'Pendiente'");
        }
    }
};
