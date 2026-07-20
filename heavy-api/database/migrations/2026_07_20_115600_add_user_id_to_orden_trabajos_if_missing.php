<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orden_trabajos') || Schema::hasColumn('orden_trabajos', 'user_id')) {
            return;
        }

        Schema::table('orden_trabajos', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });

        if (Schema::hasTable('users') && ! $this->hasForeignKey('orden_trabajos', 'user_id')) {
            Schema::table('orden_trabajos', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('orden_trabajos') || ! Schema::hasColumn('orden_trabajos', 'user_id')) {
            return;
        }

        if ($this->hasForeignKey('orden_trabajos', 'user_id')) {
            Schema::table('orden_trabajos', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        Schema::table('orden_trabajos', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }

    private function hasForeignKey(string $table, string $column): bool
    {
        return collect(Schema::getForeignKeys($table))
            ->contains(fn (array $foreignKey): bool => ($foreignKey['columns'][0] ?? null) === $column);
    }
};
