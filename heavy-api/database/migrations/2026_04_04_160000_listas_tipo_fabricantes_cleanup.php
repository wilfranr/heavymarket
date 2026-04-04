<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('listas')->where('tipo', 'Marca')->update(['fabricante_id' => null]);

        DB::table('listas')->where('tipo', 'Fabricante')->update(['tipo' => 'Fabricantes']);
    }

    public function down(): void
    {
        DB::table('listas')->where('tipo', 'Fabricantes')->update(['tipo' => 'Fabricante']);
    }
};
