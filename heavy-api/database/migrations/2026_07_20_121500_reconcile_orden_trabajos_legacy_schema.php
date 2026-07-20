<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orden_trabajos')) {
            return;
        }

        $this->addColumnIfMissing('user_id', fn (Blueprint $table) => $table->unsignedBigInteger('user_id')->nullable());
        $this->addColumnIfMissing('tercero_id', fn (Blueprint $table) => $table->unsignedBigInteger('tercero_id')->nullable());
        $this->addColumnIfMissing('pedido_id', fn (Blueprint $table) => $table->unsignedBigInteger('pedido_id')->nullable());
        $this->addColumnIfMissing('cotizacion_id', fn (Blueprint $table) => $table->unsignedBigInteger('cotizacion_id')->nullable());
        $this->addColumnIfMissing('estado', fn (Blueprint $table) => $table->string('estado')->default('Pendiente'));
        $this->addColumnIfMissing('fecha_ingreso', fn (Blueprint $table) => $table->date('fecha_ingreso')->nullable());
        $this->addColumnIfMissing('fecha_entrega', fn (Blueprint $table) => $table->date('fecha_entrega')->nullable());
        $this->addColumnIfMissing('direccion_id', fn (Blueprint $table) => $table->unsignedBigInteger('direccion_id')->nullable());
        $this->addColumnIfMissing('telefono', fn (Blueprint $table) => $table->string('telefono')->nullable());
        $this->addColumnIfMissing('observaciones', fn (Blueprint $table) => $table->text('observaciones')->nullable());
        $this->addColumnIfMissing('guia', fn (Blueprint $table) => $table->string('guia')->nullable());
        $this->addColumnIfMissing('transportadora_id', fn (Blueprint $table) => $table->unsignedBigInteger('transportadora_id')->nullable());
        $this->addColumnIfMissing('archivo', fn (Blueprint $table) => $table->string('archivo')->nullable());
        $this->addColumnIfMissing('motivo_cancelacion', fn (Blueprint $table) => $table->string('motivo_cancelacion')->nullable());
        $this->addColumnIfMissing('created_at', fn (Blueprint $table) => $table->timestamp('created_at')->nullable());
        $this->addColumnIfMissing('updated_at', fn (Blueprint $table) => $table->timestamp('updated_at')->nullable());

        $this->addIndexIfMissing('estado', 'orden_trabajos_estado_index');
        $this->addIndexIfMissing('tercero_id', 'orden_trabajos_tercero_id_index');
        $this->addIndexIfMissing('pedido_id', 'orden_trabajos_pedido_id_index');
        $this->addIndexIfMissing('cotizacion_id', 'orden_trabajos_cotizacion_id_index');
    }

    public function down(): void
    {
        // Migración de reconciliación: no elimina columnas para evitar pérdida de datos legacy.
    }

    private function addColumnIfMissing(string $column, callable $definition): void
    {
        if (Schema::hasColumn('orden_trabajos', $column)) {
            return;
        }

        Schema::table('orden_trabajos', function (Blueprint $table) use ($definition): void {
            $definition($table);
        });
    }

    private function addIndexIfMissing(string $column, string $indexName): void
    {
        if (! Schema::hasColumn('orden_trabajos', $column) || $this->hasIndex('orden_trabajos', $indexName)) {
            return;
        }

        Schema::table('orden_trabajos', function (Blueprint $table) use ($column, $indexName): void {
            $table->index($column, $indexName);
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index): bool => ($index['name'] ?? null) === $indexName);
    }
};
