<?php

namespace App\Policies;

use App\Models\Maquina;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MaquinaPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function view(User $user, Maquina $maquina): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    public function update(User $user, Maquina $maquina): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    public function delete(User $user, Maquina $maquina): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    public function restore(User $user, Maquina $maquina): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function forceDelete(User $user, Maquina $maquina): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}
