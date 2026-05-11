<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\OrdenTrabajo;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy para el modelo OrdenTrabajo
 *
 * Define los permisos para las operaciones CRUD sobre órdenes de trabajo.
 *
 * Roles autorizados:
 * - Super Admin: Acceso total
 * - Administrador: CRUD completo
 * - Logistica: solo lectura (viewAny, view)
 * - Vendedor: solo lectura (viewAny, view)
 */
class OrdenTrabajoPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Logistica']);
    }

    /**
     * Determine whether the user can create models.
     *
     * Solo Administradores y superiores pueden crear órdenes de trabajo.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can update the model.
     *
     * Solo Administradores y superiores pueden actualizar órdenes de trabajo.
     */
    public function update(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can delete the model.
     *
     * Solo Administradores pueden eliminar órdenes de trabajo.
     */
    public function delete(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can update estado de referencias.
     *
     * Solo Administradores y superiores pueden cambiar el estado de los ítems.
     */
    public function updateEstadoReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can mark item as Cancelado.
     *
     * Solo Administradores pueden marcar ítems como cancelados.
     */
    public function cancelarReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can mark item as Recibido.
     *
     * Solo Administradores y superiores pueden marcar ítems como recibidos.
     */
    public function recibirReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can dispatch items.
     *
     * Solo Administradores y superiores pueden despachar ítems al cliente.
     */
    public function dispatchReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }
}
