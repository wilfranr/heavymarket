<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            if (! Schema::hasColumn('pedidos', 'origen')) {
                $table->string('origen', 20)->default('panel')->after('user_id');
                $table->index('origen');
            }
        });

        DB::table('pedidos')
            ->where(function ($query) {
                $query->whereNull('user_id')
                    ->orWhere('comentario', 'like', '%Cotizaci%Landing%');
            })
            ->update(['origen' => 'landing']);
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            if (Schema::hasColumn('pedidos', 'origen')) {
                $table->dropIndex(['origen']);
                $table->dropColumn('origen');
            }
        });
    }
};
