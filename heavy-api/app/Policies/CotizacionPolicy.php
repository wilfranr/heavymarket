<?php

namespace App\Policies;

use App\Models\Cotizacion;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CotizacionPolicy
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
    public function view(User $user, Cotizacion $cotizacion): bool
    {
        if ($user->hasAnyRole(['super_admin', 'Administrador', 'Logistica'])) {
            return true;
        }

        if ($user->hasRole('Analista')) {
            return true;
        }

        if ($user->hasRole('Vendedor')) {
            return $cotizacion->user_id === $user->id
                || $cotizacion->pedido->user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Cotizacion $cotizacion): bool
    {
        if ($user->hasAnyRole(['super_admin', 'Administrador'])) {
            return true;
        }

        if ($user->hasRole('Analista')) {
            return in_array($cotizacion->estado, ['Enviada', 'En_Proceso']);
        }

        return $user->id === $cotizacion->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Cotizacion $cotizacion): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can approve the cotizacion.
     */
    public function approve(User $user, Cotizacion $cotizacion): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can reject the cotizacion.
     */
    public function reject(User $user, Cotizacion $cotizacion): bool
    {
        return $user->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Determine whether the user can download the PDF.
     */
    public function downloadPdf(User $user, Cotizacion $cotizacion): bool
    {
        return $this->view($user, $cotizacion);
    }
}
