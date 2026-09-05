<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('articulos')->whereNull('peso')->update(['peso' => 0]);

        // MODIFY es sintaxis MySQL; SQLite (usado en la suite de tests) no la soporta.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE articulos MODIFY peso DECIMAL(15, 2) NOT NULL DEFAULT 0');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE articulos MODIFY peso DECIMAL(15, 2) NULL DEFAULT NULL');
        }
    }
};
