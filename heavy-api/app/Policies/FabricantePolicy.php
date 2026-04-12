<?php

namespace App\Policies;

use App\Models\Fabricante;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FabricantePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function view(User $user, Fabricante $fabricante): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function update(User $user, Fabricante $fabricante): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function delete(User $user, Fabricante $fabricante): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function restore(User $user, Fabricante $fabricante): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function forceDelete(User $user, Fabricante $fabricante): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}
