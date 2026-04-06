<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tras migrar fabricante_id de IDs de fabricantes a IDs de listas (tipo Fabricantes),
 * la FK en MySQL seguía referenciando fabricantes y provocaba 1452 al actualizar máquinas.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        if (! Schema::hasTable('maquinas') || ! Schema::hasTable('listas')) {
            return;
        }

        $this->dropForeignKeysReferencingTable('maquinas', 'fabricante_id', 'fabricantes');

        if ($this->foreignKeyReferencesTable('maquinas', 'fabricante_id', 'listas') === null) {
            Schema::table('maquinas', function (Blueprint $table) {
                $table->foreign('fabricante_id')
                    ->references('id')
                    ->on('listas')
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        if (! Schema::hasTable('maquinas')) {
            return;
        }

        $name = $this->foreignKeyReferencesTable('maquinas', 'fabricante_id', 'listas');
        if ($name !== null) {
            DB::statement('ALTER TABLE `maquinas` DROP FOREIGN KEY `'.$name.'`');
        }
    }

    /**
     * @return list<string>
     */
    private function dropForeignKeysReferencingTable(string $table, string $column, string $referencedTable): array
    {
        $names = $this->foreignKeyNamesReferencingTable($table, $column, $referencedTable);
        foreach ($names as $name) {
            DB::statement('ALTER TABLE `'.$table.'` DROP FOREIGN KEY `'.$name.'`');
        }

        return $names;
    }

    /**
     * @return list<string>
     */
    private function foreignKeyNamesReferencingTable(string $table, string $column, string $referencedTable): array
    {
        $rows = DB::select(
            'SELECT DISTINCT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = ?
             AND COLUMN_NAME = ?
             AND REFERENCED_TABLE_NAME = ?',
            [$table, $column, $referencedTable]
        );

        return array_values(array_filter(array_map(fn ($r) => $r->name ?? null, $rows)));
    }

    private function foreignKeyReferencesTable(string $table, string $column, string $referencedTable): ?string
    {
        $names = $this->foreignKeyNamesReferencingTable($table, $column, $referencedTable);

        return $names[0] ?? null;
    }
};
