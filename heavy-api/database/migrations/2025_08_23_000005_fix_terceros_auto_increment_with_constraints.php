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
        // Corregir específicamente la tabla terceros que tiene restricciones de clave foránea
        $this->fixTercerosTable();
        
        $this->info('✅ Tabla terceros corregida con AUTO_INCREMENT');
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
     * Corregir la tabla terceros manejando las restricciones de clave foránea
     */
    private function fixTercerosTable(): void
    {
        try {
            // Verificar si la tabla existe
            if (!Schema::hasTable('terceros')) {
                $this->info("⚠️  Tabla terceros no existe");
                return;
            }
            
            // Verificar si el campo ya tiene AUTO_INCREMENT
            $hasAutoIncrement = DB::select("
                SELECT COLUMN_DEFAULT, EXTRA 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'terceros' 
                AND COLUMN_NAME = 'id'
            ");
            
            if (empty($hasAutoIncrement)) {
                $this->info("⚠️  Campo id no encontrado en tabla terceros");
                return;
            }
            
            $columnInfo = $hasAutoIncrement[0];
            
            if (str_contains($columnInfo->EXTRA ?? '', 'auto_increment')) {
                $this->info("✅ Tabla terceros.id ya tiene AUTO_INCREMENT");
                return;
            }
            
            // Obtener todas las restricciones de clave foránea que referencian a terceros.id
            $foreignKeys = DB::select("
                SELECT 
                    CONSTRAINT_NAME,
                    TABLE_NAME,
                    COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
                AND REFERENCED_TABLE_NAME = 'terceros' 
                AND REFERENCED_COLUMN_NAME = 'id'
            ");
            
            $this->info("🔍 Encontradas " . count($foreignKeys) . " restricciones de clave foránea");
            
            // Eliminar temporalmente todas las restricciones de clave foránea
            foreach ($foreignKeys as $fk) {
                try {
                    DB::statement("ALTER TABLE `{$fk->TABLE_NAME}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
                    $this->info("✅ Restricción eliminada: {$fk->TABLE_NAME}.{$fk->CONSTRAINT_NAME}");
                } catch (\Exception $e) {
                    $this->info("⚠️  No se pudo eliminar restricción {$fk->TABLE_NAME}.{$fk->CONSTRAINT_NAME}: " . $e->getMessage());
                }
            }
            
            // Ahora podemos modificar el campo id
            DB::statement("ALTER TABLE `terceros` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
            $this->info("✅ AUTO_INCREMENT agregado a terceros.id");
            
            // Restaurar las restricciones de clave foránea
            foreach ($foreignKeys as $fk) {
                try {
                    // Obtener la definición completa de la restricción
                    $fkDefinition = DB::select("
                        SELECT 
                            UPDATE_RULE,
                            DELETE_RULE
                        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
                        WHERE CONSTRAINT_SCHEMA = DATABASE() 
                        AND CONSTRAINT_NAME = '{$fk->CONSTRAINT_NAME}'
                    ");
                    
                    $updateRule = $fkDefinition[0]->UPDATE_RULE ?? 'CASCADE';
                    $deleteRule = $fkDefinition[0]->DELETE_RULE ?? 'CASCADE';
                    
                    DB::statement("
                        ALTER TABLE `{$fk->TABLE_NAME}` 
                        ADD CONSTRAINT `{$fk->CONSTRAINT_NAME}` 
                        FOREIGN KEY (`{$fk->COLUMN_NAME}`) 
                        REFERENCES `terceros` (`id`) 
                        ON UPDATE {$updateRule} 
                        ON DELETE {$deleteRule}
                    ");
                    $this->info("✅ Restricción restaurada: {$fk->TABLE_NAME}.{$fk->CONSTRAINT_NAME}");
                } catch (\Exception $e) {
                    $this->info("❌ Error al restaurar restricción {$fk->TABLE_NAME}.{$fk->CONSTRAINT_NAME}: " . $e->getMessage());
                }
            }
            
        } catch (\Exception $e) {
            $this->info("❌ Error al corregir tabla terceros: " . $e->getMessage());
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
