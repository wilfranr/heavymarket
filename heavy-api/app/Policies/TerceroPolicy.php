<?php

namespace App\Policies;

use App\Models\Tercero;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TerceroPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function view(User $user, Tercero $tercero): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function update(User $user, Tercero $tercero): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    public function delete(User $user, Tercero $tercero): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function restore(User $user, Tercero $tercero): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function forceDelete(User $user, Tercero $tercero): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}
