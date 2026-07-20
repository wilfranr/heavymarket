<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Columnas que CotizacionService::crearOrdenTrabajo() puede insertar en null.
     * En bases legacy algunas existen como NOT NULL, lo que rompe la aprobación.
     *
     * @var array<string, string>
     */
    private array $nullableDefinitions = [
        'user_id' => 'BIGINT UNSIGNED NULL',
        'tercero_id' => 'BIGINT UNSIGNED NULL',
        'pedido_id' => 'BIGINT UNSIGNED NULL',
        'cotizacion_id' => 'BIGINT UNSIGNED NULL',
        'fecha_entrega' => 'DATE NULL',
        'direccion_id' => 'BIGINT UNSIGNED NULL',
        'telefono' => 'VARCHAR(255) NULL',
        'observaciones' => 'TEXT NULL',
        'guia' => 'VARCHAR(255) NULL',
        'transportadora_id' => 'BIGINT UNSIGNED NULL',
        'archivo' => 'VARCHAR(255) NULL',
        'motivo_cancelacion' => 'VARCHAR(255) NULL',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('orden_trabajos')) {
            return;
        }

        foreach ($this->nullableDefinitions as $column => $definition) {
            if (! Schema::hasColumn('orden_trabajos', $column) || $this->isNullable($column)) {
                continue;
            }

            DB::statement("ALTER TABLE `orden_trabajos` MODIFY `{$column}` {$definition}");
        }
    }

    public function down(): void
    {
        // Migración de compatibilidad: no restaura NOT NULL para no romper registros legacy.
    }

    private function isNullable(string $column): bool
    {
        $database = DB::getDatabaseName();

        $result = DB::selectOne(
            'SELECT IS_NULLABLE AS nullable_status
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$database, 'orden_trabajos', $column]
        );

        return ($result?->nullable_status ?? 'YES') === 'YES';
    }
};
