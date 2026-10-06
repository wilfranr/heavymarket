<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * En la base de datos real de desarrollo, 'direcciones' quedo con
 * city_id/state_id/country_id como NOT NULL sin default (y como varchar,
 * no bigint, otro desfase de esa misma tabla legacy -- ver
 * 2026_10_06_000001). Esto bloquea crear un perfil de despacho sin pais/
 * departamento/ciudad formales, contradiciendo el requisito de #172 de
 * que ningun campo sea obligatorio (para eso existe 'ciudad_texto' como
 * alternativa libre). Se usa SQL crudo porque modificar NULL/NOT NULL con
 * doctrine/dbal (lo que usa Blueprint::change()) requiere una dependencia
 * que este proyecto no tiene instalada.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 'MODIFY COLUMN' es sintaxis exclusiva de MySQL. En cualquier otro motor
        // (ej. SQLite en CI/tests) estas columnas ya nacen nullable desde la
        // migracion original que crea 'direcciones' -- no hay nada que corregir ahi,
        // el problema es exclusivo de bases MySQL preexistentes con el esquema legacy.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach (['city_id', 'state_id', 'country_id'] as $column) {
            if (Schema::hasColumn('direcciones', $column)) {
                DB::statement("ALTER TABLE `direcciones` MODIFY `{$column}` VARCHAR(255) NULL DEFAULT NULL");
            }
        }
    }

    public function down(): void
    {
        // No reversible de forma segura: volver a NOT NULL fallaria si ya hay filas con NULL.
    }
};
