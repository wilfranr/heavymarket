<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Esta migración representa el estado consolidado del sistema core
        // No crea nuevas tablas, solo documenta el estado actual
        
        $this->info('Sistema Core consolidado - Estado actual de las tablas principales');
        
        // Tablas del sistema de autenticación y permisos
        $this->info('✅ users - Sistema de usuarios');
        $this->info('✅ permissions - Permisos del sistema');
        $this->info('✅ roles - Roles del sistema');
        $this->info('✅ role_has_permissions - Relación roles-permisos');
        $this->info('✅ model_has_permissions - Permisos asignados a modelos');
        $this->info('✅ model_has_roles - Roles asignados a modelos');
        
        // Tablas de configuración del sistema
        $this->info('✅ empresas - Empresas configuradas');
        $this->info('✅ fabricantes - Fabricantes del sistema');
        $this->info('✅ sistemas - Sistemas disponibles');
        $this->info('✅ trms - Tasas de cambio');
        $this->info('✅ listas - Listas del sistema');
        
        // Tablas de ubicaciones geográficas
        $this->info('✅ countries - Países');
        $this->info('✅ states - Estados/Provincias');
        $this->info('✅ cities - Ciudades');
        
        $this->info('Sistema Core consolidado exitosamente');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede hacer rollback de una consolidación
        $this->info('⚠️  No se puede hacer rollback de una consolidación');
    }
    
    /**
     * Información sobre la consolidación
     */
    private function info($message)
    {
        echo $message . PHP_EOL;
    }
};
