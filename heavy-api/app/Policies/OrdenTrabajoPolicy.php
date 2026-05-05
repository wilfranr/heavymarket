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
 * - Logistica: puede crear, actualizar estados y referencias
 * - Vendedor: solo lectura
 * - Analista: solo lectura
 */
class OrdenTrabajoPolicy
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
    public function view(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica', 'Analista']);
    }

    /**
     * Determine whether the user can create models.
     *
     * Solo Administradores y Logística pueden crear órdenes de trabajo.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * Determine whether the user can update the model.
     *
     * Logistica puede actualizar estados de referencias.
     * Administradores pueden actualizar todo.
     */
    public function update(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
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
     * Logistica y superiores pueden cambiar el estado de los ítems.
     */
    public function updateEstadoReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
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
     * Logistica puede marcar ítems como recibidos.
     */
    public function recibirReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * Determine whether the user can dispatch items.
     *
     * Logistica puede despachar ítems al cliente.
     */
    public function dispatchReferencia(User $user, OrdenTrabajo $ordenTrabajo): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }
}
