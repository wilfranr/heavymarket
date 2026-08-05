<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migra los estados legacy de órdenes de compra al nuevo ciclo de vida.
 *
 * Cambios del issue de Logística:
 * - 'Pendiente de envío' -> 'Generada' (renombrado)
 * - 'Cerrada' -> 'Recibida' (eliminado, equivalente funcional)
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orden_compras')
            ->where('estado', 'Pendiente de envío')
            ->update([
                'estado' => 'Generada',
                'color'  => '#FFFF00',
            ]);

        DB::table('orden_compras')
            ->where('estado', 'Cerrada')
            ->update([
                'estado' => 'Recibida',
                'color'  => '#00ff00',
            ]);
    }

    public function down(): void
    {
        DB::table('orden_compras')
            ->where('estado', 'Generada')
            ->update([
                'estado' => 'Pendiente de envío',
                'color'  => '#FFFF00',
            ]);
    }
};
