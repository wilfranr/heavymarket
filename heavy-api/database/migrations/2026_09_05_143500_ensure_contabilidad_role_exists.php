<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Migración para garantizar que el rol 'Contabilidad' exista en el guard 'web'.
 *
 * Este rol es requerido por el módulo de Facturación: ve la bandeja de
 * Órdenes de Trabajo en estado "Lista para Facturar" y ejecuta el cierre
 * comercial (OrdenTrabajoController::facturar).
 *
 * El rol se crea de forma idempotente (firstOrCreate) para que sea seguro
 * ejecutarla en cualquier entorno, siguiendo el mismo patrón que
 * 2026_02_22_180242_ensure_cliente_role_exists.php.
 */
return new class extends Migration
{
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(
            ['name' => 'Contabilidad', 'guard_name' => 'web']
        );
    }

    /**
     * No se elimina intencionalmente para preservar integridad de datos.
     */
    public function down(): void
    {
        //
    }
};
