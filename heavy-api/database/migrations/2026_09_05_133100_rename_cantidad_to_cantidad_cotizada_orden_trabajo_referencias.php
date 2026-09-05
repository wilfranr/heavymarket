<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('orden_trabajo_referencias', 'cantidad') && ! Schema::hasColumn('orden_trabajo_referencias', 'cantidad_cotizada')) {
            Schema::table('orden_trabajo_referencias', function (Blueprint $table): void {
                $table->renameColumn('cantidad', 'cantidad_cotizada');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orden_trabajo_referencias', 'cantidad_cotizada') && ! Schema::hasColumn('orden_trabajo_referencias', 'cantidad')) {
            Schema::table('orden_trabajo_referencias', function (Blueprint $table): void {
                $table->renameColumn('cantidad_cotizada', 'cantidad');
            });
        }
    }
};
