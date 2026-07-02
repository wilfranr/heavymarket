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
        Schema::table('medidas', function (Blueprint $table) {
            $table->dropColumn('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('medidas', function (Blueprint $table) {
            $table->string('nombre')->nullable()->after('identificador');
        });
    }
};
