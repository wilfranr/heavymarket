<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Campos opcionales en el FormRequest/modelo que en bases legacy existen como NOT NULL.
     *
     * @var array<string, string>
     */
    private array $nullableDefinitions = [
        'city_id' => 'BIGINT UNSIGNED NULL',
        'state_id' => 'BIGINT UNSIGNED NULL',
        'country_id' => 'BIGINT UNSIGNED NULL',
        'nit' => 'VARCHAR(255) NULL',
        'telefono' => 'VARCHAR(255) NULL',
        'direccion' => 'VARCHAR(255) NULL',
        'email' => 'VARCHAR(255) NULL',
        'contacto' => 'VARCHAR(255) NULL',
        'celular' => 'VARCHAR(255) NULL',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('transportadoras')) {
            return;
        }

        Schema::table('transportadoras', function (Blueprint $table): void {
            if (! Schema::hasColumn('transportadoras', 'city_id')) {
                $table->unsignedBigInteger('city_id')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'state_id')) {
                $table->unsignedBigInteger('state_id')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'country_id')) {
                $table->unsignedBigInteger('country_id')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'contacto')) {
                $table->string('contacto')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'celular')) {
                $table->string('celular')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'observaciones')) {
                $table->string('observaciones')->nullable();
            }
            if (! Schema::hasColumn('transportadoras', 'logo')) {
                $table->string('logo')->nullable();
            }
        });

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->nullableDefinitions as $column => $definition) {
            if (! Schema::hasColumn('transportadoras', $column) || $this->isNullable($column)) {
                continue;
            }

            DB::statement("ALTER TABLE `transportadoras` MODIFY `{$column}` {$definition}");
        }
    }

    public function down(): void
    {
        // Compatibilidad legacy: no restaura NOT NULL para no romper inserciones sin ciudad.
    }

    private function isNullable(string $column): bool
    {
        $result = DB::selectOne(
            'SELECT IS_NULLABLE AS nullable_status
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [DB::getDatabaseName(), 'transportadoras', $column]
        );

        return ($result?->nullable_status ?? 'YES') === 'YES';
    }
};
