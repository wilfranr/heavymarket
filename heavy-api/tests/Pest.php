<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Unit/Http/Resources');

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Unit/Traits');

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Unit/Policies');

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
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
}

function seedPermissions(array $permissions = []): void
{
    $defaultPermissions = ['view orders', 'create orders', 'update orders', 'delete orders'];
    $permissions = array_merge($defaultPermissions, $permissions);

    foreach ($permissions as $permission) {
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }
}

function createUserWithRole(string $role, array $attributes = []): \App\Models\User
{
    $user = \App\Models\User::factory()->create($attributes);
    $user->assignRole($role);

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
