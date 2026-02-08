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
        Schema::table('terceros', function (Blueprint $row) {
            $row->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $row->string('tipo_documento')->nullable()->change();
            $row->string('numero_documento')->nullable()->change();
            $row->string('telefono')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terceros', function (Blueprint $row) {
            $row->dropForeign(['user_id']);
            $row->dropColumn('user_id');
            $row->string('tipo_documento')->nullable(false)->change();
            $row->string('numero_documento')->nullable(false)->change();
            $row->string('telefono')->nullable(false)->change();
        });
    }
};
