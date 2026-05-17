<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('pedidos')
            ->where('origen', '!=', 'landing')
            ->where(function ($query) {
                $query->whereNull('user_id')
                    ->orWhere('comentario', 'like', '%Cotizaci%Landing%');
            })
            ->update(['origen' => 'landing']);
    }

    public function down(): void
    {
        //
    }
};
