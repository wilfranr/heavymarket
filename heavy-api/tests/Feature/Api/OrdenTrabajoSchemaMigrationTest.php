<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('reconcilia columnas faltantes en orden_trabajos legacy', function () {
    $columnasLegacyFaltantes = [
        'telefono',
        'observaciones',
        'guia',
        'transportadora_id',
        'archivo',
        'motivo_cancelacion',
    ];

    Schema::table('orden_trabajos', function ($table) use ($columnasLegacyFaltantes): void {
        $table->dropColumn($columnasLegacyFaltantes);
    });

    foreach ($columnasLegacyFaltantes as $columna) {
        expect(Schema::hasColumn('orden_trabajos', $columna))->toBeFalse();
    }

    $migration = require database_path('migrations/2026_07_20_121500_reconcile_orden_trabajos_legacy_schema.php');
    $migration->up();

    foreach ([
        'user_id',
        'tercero_id',
        'pedido_id',
        'cotizacion_id',
        'estado',
        'fecha_ingreso',
        'fecha_entrega',
        'direccion_id',
        'telefono',
        'observaciones',
        'guia',
        'transportadora_id',
        'archivo',
        'motivo_cancelacion',
        'created_at',
        'updated_at',
    ] as $columnaEsperada) {
        expect(Schema::hasColumn('orden_trabajos', $columnaEsperada))->toBeTrue();
    }
});

it('normaliza nullable en columnas legacy de orden_trabajos', function () {
    DB::statement('ALTER TABLE `orden_trabajos` MODIFY `telefono` VARCHAR(255) NOT NULL');

    expect(ordenTrabajoColumnIsNullable('telefono'))->toBeFalse();

    $migration = require database_path('migrations/2026_07_20_123000_make_orden_trabajos_nullable_legacy_columns.php');
    $migration->up();

    expect(ordenTrabajoColumnIsNullable('telefono'))->toBeTrue();
});

function ordenTrabajoColumnIsNullable(string $column): bool
{
    $result = DB::selectOne(
        'SELECT IS_NULLABLE AS nullable_status
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [DB::getDatabaseName(), 'orden_trabajos', $column]
    );

    return ($result?->nullable_status ?? 'NO') === 'YES';
}
