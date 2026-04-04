<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Lista;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $listas = Lista::where('tipo', 'Fabricantes')->get()->keyBy('fabricante_id');
        
        foreach ($listas as $oldId => $lista) {
            DB::table('maquinas')
                ->where('fabricante_id', $oldId)
                ->update(['fabricante_id' => $lista->id]);
        }

        foreach ($listas as $oldId => $lista) {
            DB::table('referencias')
                ->where('marca_id', $oldId)
                ->update(['marca_id' => $lista->id]);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }

    public function down(): void
    {
    }
};
