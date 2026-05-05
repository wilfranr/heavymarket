<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = Schema::getColumnListing('orden_compras');

        // Asegurar que las columnas FK sean nullable
        $nullableFkColumns = ['tercero_id', 'pedido_id', 'referencia_id'];
        foreach ($nullableFkColumns as $col) {
            if (in_array($col, $columns)) {
                Schema::table('orden_compras', function (Blueprint $table) use ($col) {
                    $table->unsignedBigInteger($col)->nullable()->change();
                });
            }
        }

        // Renombrar cotizaciones_id -> cotizacion_id si aplica
        if (in_array('cotizaciones_id', $columns) && ! in_array('cotizacion_id', $columns)) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->renameColumn('cotizaciones_id', 'cotizacion_id');
            });
        }

        // Agregar FKs solo si no existen
        if (! $this->hasForeignKey('orden_compras', 'tercero_id')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->foreign('tercero_id')->references('id')->on('terceros')->nullOnDelete();
            });
        }
        if (! $this->hasForeignKey('orden_compras', 'pedido_id')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->foreign('pedido_id')->references('id')->on('pedidos')->nullOnDelete();
            });
        }
        if (! $this->hasForeignKey('orden_compras', 'cotizacion_id')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->foreign('cotizacion_id')->references('id')->on('cotizaciones')->nullOnDelete();
            });
        }
        if (! $this->hasForeignKey('orden_compras', 'proveedor_id')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->foreign('proveedor_id')->references('id')->on('terceros')->restrictOnDelete();
            });
        }
        if (in_array('referencia_id', $columns) && ! $this->hasForeignKey('orden_compras', 'referencia_id')) {
            Schema::table('orden_compras', function (Blueprint $table) {
                $table->foreign('referencia_id')->references('id')->on('referencias')->nullOnDelete();
            });
        }

        if (! $this->hasForeignKey('orden_compra_referencia', 'orden_compra_id')) {
            Schema::table('orden_compra_referencia', function (Blueprint $table) {
                $table->foreign('orden_compra_id')->references('id')->on('orden_compras')->cascadeOnDelete();
            });
        }
        if (! $this->hasForeignKey('orden_compra_referencia', 'referencia_id')) {
            Schema::table('orden_compra_referencia', function (Blueprint $table) {
                $table->foreign('referencia_id')->references('id')->on('referencias')->restrictOnDelete();
            });
        }
        if (! $this->hasIndex('orden_compra_referencia', 'idx_ocr_orden_compra_id')) {
            Schema::table('orden_compra_referencia', function (Blueprint $table) {
                $table->index('orden_compra_id', 'idx_ocr_orden_compra_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('orden_compra_referencia', function (Blueprint $table) {
            $table->dropForeign(['orden_compra_id']);
            $table->dropForeign(['referencia_id']);
            $table->dropIndex('idx_ocr_orden_compra_id');
        });

        Schema::table('orden_compras', function (Blueprint $table) {
            $table->dropForeign(['tercero_id']);
            $table->dropForeign(['pedido_id']);
            $table->dropForeign(['cotizacion_id']);
            $table->dropForeign(['proveedor_id']);
            $table->dropForeign(['referencia_id']);
        });
    }

    private function hasForeignKey(string $table, string $column): bool
    {
        $foreignKeys = Schema::getForeignKeys($table);

        return collect($foreignKeys)->contains(fn ($fk) => $fk['columns'][0] === $column);
    }

    private function hasIndex(string $table, string $index): bool
    {
        $indexes = Schema::getIndexes($table);

        return collect($indexes)->contains(fn ($idx) => $idx['name'] === $index);
    }
};
