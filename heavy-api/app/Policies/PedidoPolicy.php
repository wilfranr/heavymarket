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
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pedido $pedido): bool
    {
        // Analista solo ve pedidos en análisis
        if ($user->hasRole('Analista')) {
            return $pedido->estado === 'En_Analisis';
        }

        // Admin ven todo
        if ($user->hasAnyRole(['super_admin', 'Administrador'])) {
            return true;
        }

        // Vendedor ve: sus pedidos o pedidos con origen landing
        if ($user->hasRole('Vendedor')) {
            return $pedido->esVisibleParaVendedor($user);
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Edicion comercial del pedido (formulario /edit, PUT /pedidos/{id}).
     * Desde En_Costeo en adelante nadie modifica items desde aqui: usar guardar-costeo o devolver al analista.
     */
    public function editComercial(User $user, Pedido $pedido): bool
    {
        if (in_array($pedido->estado, ['Cancelado', 'En_Costeo', 'Cotizado', 'Aprobado', 'Rechazado', 'Enviado', 'Entregado'], true)) {
            return false;
        }

        if ($user->hasRole('Analista')) {
            return $pedido->estado === 'En_Analisis';
        }

        if ($user->hasRole('Vendedor') && $pedido->estado === 'En_Analisis') {
            return false;
        }

        return $user->hasAnyRole(['super_admin', 'Administrador'])
            || $user->id === $pedido->user_id
            || $pedido->esDeLanding();
    }

    /**
     * Operaciones de mutación del pedido (costeo, devoluciones, transiciones vía endpoints dedicados).
     */
    public function update(User $user, Pedido $pedido): bool
    {
        // El Analista solo puede trabajar con pedidos en análisis de partes/referencias
        if ($user->hasRole('Analista')) {
            return $pedido->estado === 'En_Analisis';
        }

        // El vendedor puede ver sus pedidos en análisis, pero no modificarlos (solo lectura)
        if ($user->hasRole('Vendedor') && $pedido->estado === 'En_Analisis') {
            return false;
        }

        // Admin pueden editar todo
        // Vendedor puede editar sus pedidos o pedidos landing (les toma el pedido)
        return $user->hasAnyRole(['super_admin', 'Administrador'])
            || $user->id === $pedido->user_id
            || $pedido->esDeLanding();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pedido $pedido): bool
    {
        if ($user->hasAnyRole(['super_admin', 'Administrador'])) {
            return true;
        }

        if ($user->hasRole('Vendedor') && $user->id === $pedido->user_id) {
            return $pedido->estado !== 'En_Analisis';
        }

        return false;
    }
}
