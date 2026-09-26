<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Recuperación local: roles base y usuarios de desarrollo.
 * Uso: php artisan db:seed --class=DevBootstrapSeeder
 */
class DevBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['super_admin', 'Administrador', 'Vendedor', 'Gerente Comercial', 'Analista', 'Logistica', 'Contabilidad', 'Cliente', 'Proveedor', 'panel_user'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@heavymarket.net'],
            ['name' => 'Administrador', 'password' => Hash::make('password')]
        );
        $admin->syncRoles(['super_admin', 'Administrador']);

        $vendedor = User::query()->updateOrCreate(
            ['email' => 'vendedor@heavymarket.net'],
            ['name' => 'Vendedor Demo', 'password' => Hash::make('password')]
        );
        $vendedor->syncRoles(['Vendedor']);

        $gerente = User::query()->updateOrCreate(
            ['email' => 'gerente@heavymarket.net'],
            ['name' => 'Gerente Comercial Demo', 'password' => Hash::make('password')]
        );
        $gerente->syncRoles(['Gerente Comercial']);

        $contabilidad = User::query()->updateOrCreate(
            ['email' => 'contabilidad@heavymarket.net'],
            ['name' => 'Contabilidad Demo', 'password' => Hash::make('password')]
        );
        $contabilidad->syncRoles(['Contabilidad']);

        $logistica = User::query()->updateOrCreate(
            ['email' => 'logistica@heavymarket.net'],
            ['name' => 'Logistica Demo', 'password' => Hash::make('password')]
        );
        $logistica->syncRoles(['Logistica']);
    }
}
