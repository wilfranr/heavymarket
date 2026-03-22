<?php

namespace App\Policies;

use App\Models\Referencia;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReferenciaPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function view(User $user, Referencia $referencia): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function update(User $user, Referencia $referencia): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function delete(User $user, Referencia $referencia): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function restore(User $user, Referencia $referencia): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function forceDelete(User $user, Referencia $referencia): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}