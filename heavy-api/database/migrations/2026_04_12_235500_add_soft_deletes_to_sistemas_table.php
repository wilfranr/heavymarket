<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sistemas')) {
            return;
        }

        Schema::table('sistemas', function (Blueprint $table): void {
            if (! Schema::hasColumn('sistemas', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('sistemas') || ! Schema::hasColumn('sistemas', 'deleted_at')) {
            return;
        }

        Schema::table('sistemas', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });
    }
};
