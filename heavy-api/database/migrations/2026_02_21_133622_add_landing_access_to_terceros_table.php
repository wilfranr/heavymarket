<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agrega el campo landing_access a la tabla terceros.
     * Cuando está activo, el tercero puede iniciar sesión en la landing
     * con su email y la contraseña asignada (vinculada a un User).
     */
    public function up(): void
    {
        Schema::table('terceros', function (Blueprint $table) {
            $table->boolean('landing_access')->default(false)->after('user_id')
                ->comment('Habilita el acceso del tercero a la landing page');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terceros', function (Blueprint $table) {
            $table->dropColumn('landing_access');
        });
    }
};
