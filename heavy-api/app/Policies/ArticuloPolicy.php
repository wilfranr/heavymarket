<?php

namespace App\Policies;

use App\Models\Articulo;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ArticuloPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function view(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica', 'panel_user']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    public function update(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    public function delete(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    public function restore(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function forceDelete(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    public function manageMedidas(User $user, Articulo $articulo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }
}
