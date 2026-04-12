<?php

namespace App\Policies;

use App\Models\Pedido;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PedidoPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista', 'Logistica']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pedido $pedido): bool
    {
        if ($user->hasRole('Analista')) {
            return $pedido->estado === 'En_Analisis';
        }

        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])
            || $user->id === $pedido->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Pedido $pedido): bool
    {
        // El Analista solo puede trabajar con pedidos en análisis de partes/referencias
        if ($user->hasRole('Analista')) {
            return $pedido->estado === 'En_Analisis';
        }

        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])
            || $user->id === $pedido->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pedido $pedido): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}
