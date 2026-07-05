<?php

$cliDatabase = getenv('DB_DATABASE') ?: '';

if ($cliDatabase === 'heavymarket') {
    fwrite(STDERR, "BLOQUEADO: DB_DATABASE=heavymarket en la línea de comandos.\n");
    fwrite(STDERR, "Los tests deben usar .env.testing (DB_DATABASE=heavymarket_test).\n");
    exit(1);
}

if ($cliDatabase !== '' && $cliDatabase !== 'heavymarket_test') {
    fwrite(STDERR, "BLOQUEADO: DB_DATABASE={$cliDatabase} no está permitido para tests.\n");
    fwrite(STDERR, "Use DB_DATABASE=heavymarket_test o ejecute ./vendor/bin/pest sin sobrescribir DB_*.\n");
    exit(1);
}

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit/Http/Resources');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit/Traits');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit/Policies');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit/Services');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit/Seeders');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function seedRoles(array $roles = []): void
{
    $defaultRoles = ['super_admin', 'panel_user', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'Cliente'];
    $roles = array_merge($defaultRoles, $roles);

    foreach ($roles as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
}

function seedPermissions(array $permissions = []): void
{
    $defaultPermissions = ['view orders', 'create orders', 'update orders', 'delete orders'];
    $permissions = array_merge($defaultPermissions, $permissions);

    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }
}

function createUserWithRole(string $role, array $attributes = []): User
{
    $user = User::factory()->create($attributes);
    $user->assignRole($role);
    $user->load('roles'); // Ensure roles are loaded for Gate

    return $user;
}

function expectDatabaseHas(string $table, array $data): void
{
    test()->assertDatabaseHas($table, $data);
}

function expectDatabaseMissing(string $table, array $data): void
{
    test()->assertDatabaseMissing($table, $data);
}

function expectDatabaseCount(string $table, int $count): void
{
    test()->assertDatabaseCount($table, $count);
}

function andDatabaseHas(string $table, array $data): void
{
    test()->assertDatabaseHas($table, $data);
}
