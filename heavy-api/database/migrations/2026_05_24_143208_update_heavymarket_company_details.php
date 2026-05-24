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
        \Illuminate\Support\Facades\DB::table('empresas')
            ->where('id', 2)
            ->orWhere('siglas', 'HM')
            ->update([
                'nombre' => 'Heavymarket S.A.S.',
                'nit' => '901.881.206-8',
                'direccion' => 'Carrera 79 C No. 40 A – 72 sur – Bogotá, Colombia',
                'telefono' => '320 840 0279',
                'email' => 'comercial@heavymarket.net',
                'logo_dark' => null,
                'logo_light' => null,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No es necesario deshacer
    }
};
