<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class ProveedorRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asegurar que el rol Proveedor exista
        if (! Role::where('name', 'Proveedor')->exists()) {
            Role::create(['name' => 'Proveedor', 'guard_name' => 'web']);
        }
    }
}
