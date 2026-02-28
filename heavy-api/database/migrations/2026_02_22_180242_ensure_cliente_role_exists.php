<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

/**
 * Migración para garantizar que el rol 'Cliente' exista en el guard 'web'.
 *
 * Este rol es requerido por TerceroController y ClientAuthController
 * cuando se habilita el acceso a la landing page para un Tercero.
 *
 * El rol se crea de forma idempotente (firstOrCreate) para que
 * sea seguro ejecutarla en cualquier entorno.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Limpiar caché de permisos para evitar conflictos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(
            ['name' => 'Cliente', 'guard_name' => 'web']
        );
    }

    /**
     * Reverse the migrations.
     * 
     * No eliminamos el rol en el rollback para evitar romper datos existentes.
     * Si necesitas eliminar el rol, hazlo manualmente con cuidado.
     */
    public function down(): void
    {
        // No se elimina intencionalmente para preservar integridad de datos.
    }
};
