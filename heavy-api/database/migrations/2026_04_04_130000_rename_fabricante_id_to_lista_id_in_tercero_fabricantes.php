<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tercero_fabricantes', function (Blueprint $table) {
            $table->renameColumn('fabricante_id', 'lista_id');
        });
    }

    public function down(): void
    {
        Schema::table('tercero_fabricantes', function (Blueprint $table) {
            $table->renameColumn('lista_id', 'fabricante_id');
        });
    }
};
