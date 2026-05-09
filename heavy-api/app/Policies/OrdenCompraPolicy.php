<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\OrdenCompra;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy para el modelo OrdenCompra
 */
class OrdenCompraPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    public function view(User $user, OrdenCompra $ordenCompra): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OrdenCompra $ordenCompra): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, OrdenCompra $ordenCompra): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, OrdenCompra $ordenCompra): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }
}
