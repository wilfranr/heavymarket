<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        try {
            DB::statement('ALTER TABLE tercero_fabricantes DROP FOREIGN KEY terecero_marcas_marca_id_foreign');
        } catch (Exception $e) {
            // FK might not exist
        }

        try {
            DB::statement('ALTER TABLE tercero_fabricantes DROP FOREIGN KEY tercero_fabricantes_ibfk_1');
        } catch (Exception $e) {
            // FK might not exist
        }
    }

    public function down(): void {}
};
