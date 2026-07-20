<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orden_compras') || ! Schema::hasColumn('orden_compras', 'estado')) {
            return;
        }

        DB::table('orden_compras')
            ->where('estado', 'Borrador')
            ->update([
                'estado' => 'Pendiente de envío',
                'color' => '#FFFF00',
            ]);
    }

    public function down(): void
    {
        // No se revierte automáticamente: Borrador fue removido por decisión de negocio.
    }
};
