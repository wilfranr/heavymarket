<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Corregir AUTO_INCREMENT en campos ID de todas las tablas principales
        $this->fixAutoIncrement('terceros', 'id');
        $this->fixAutoIncrement('tercero_contacto', 'id');
        $this->fixAutoIncrement('tercero_fabricantes', 'id');
        $this->fixAutoIncrement('tercero_maquina', 'id');
        $this->fixAutoIncrement('tercero_sistemas', 'id');
        $this->fixAutoIncrement('tercero_marcas', 'id');
        
        // Agregar PRIMARY KEY si no existe
        $this->addPrimaryKeyIfMissing('terceros', 'id');
        $this->addPrimaryKeyIfMissing('tercero_contacto', 'id');
        $this->addPrimaryKeyIfMissing('tercero_fabricantes', 'id');
        $this->addPrimaryKeyIfMissing('tercero_maquina', 'id');
        $this->addPrimaryKeyIfMissing('tercero_sistemas', 'id');
        $this->addPrimaryKeyIfMissing('tercero_marcas', 'id');
        
        $this->info('✅ Campos ID corregidos con AUTO_INCREMENT en todas las tablas');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede hacer rollback de esta corrección
        $this->info('⚠️  No se puede hacer rollback de la corrección de AUTO_INCREMENT');
    }
    
    /**
     * Corregir AUTO_INCREMENT en un campo específico
     */
    private function fixAutoIncrement(string $table, string $column): void
    {
        try {
            // Verificar si la tabla existe
            if (!Schema::hasTable($table)) {
                $this->info("⚠️  Tabla {$table} no existe, saltando...");
                return;
            }
            
            // Verificar si el campo ya tiene AUTO_INCREMENT
            $hasAutoIncrement = DB::select("
                SELECT COLUMN_DEFAULT, EXTRA 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '{$table}' 
                AND COLUMN_NAME = '{$column}'
            ");
            
            if (empty($hasAutoIncrement)) {
                $this->info("⚠️  Campo {$column} no encontrado en tabla {$table}");
                return;
            }
            
            $columnInfo = $hasAutoIncrement[0];
            
            if (str_contains($columnInfo->EXTRA ?? '', 'auto_increment')) {
                $this->info("✅ Tabla {$table}.{$column} ya tiene AUTO_INCREMENT");
                return;
            }
            
            // Agregar AUTO_INCREMENT
            DB::statement("ALTER TABLE `{$table}` MODIFY `{$column}` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
            $this->info("✅ AUTO_INCREMENT agregado a {$table}.{$column}");
            
        } catch (\Exception $e) {
            $this->info("❌ Error al corregir {$table}.{$column}: " . $e->getMessage());
        }
    }
    
    /**
     * Agregar PRIMARY KEY si no existe
     */
    private function addPrimaryKeyIfMissing(string $table, string $column): void
    {
        try {
            // Verificar si la tabla existe
            if (!Schema::hasTable($table)) {
                return;
            }
            
            // Verificar si ya tiene PRIMARY KEY
            $hasPrimaryKey = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '{$table}' 
                AND CONSTRAINT_TYPE = 'PRIMARY KEY'
            ");
            
            if (empty($hasPrimaryKey)) {
                // Agregar PRIMARY KEY
                DB::statement("ALTER TABLE `{$table}` ADD PRIMARY KEY (`{$column}`)");
                $this->info("✅ PRIMARY KEY agregado a {$table}.{$column}");
            } else {
                $this->info("✅ Tabla {$table} ya tiene PRIMARY KEY");
            }
            
        } catch (\Exception $e) {
            $this->info("❌ Error al agregar PRIMARY KEY a {$table}.{$column}: " . $e->getMessage());
        }
    }
    
    /**
     * Información sobre la migración
     */
    private function info($message)
    {
        echo $message . PHP_EOL;
    }
};
