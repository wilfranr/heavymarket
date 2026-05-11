import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ProviderAuthService } from '../services/provider-auth.service';

/**
 * Guardia de ruta para el Portal de Proveedores
 *
 * Asegura que solo los proveedores autenticados puedan acceder a las rutas.
 * Si no está autenticado como proveedor, redirige al login de proveedores.
 */
export const providerGuard: CanActivateFn = (route, state) => {
    const providerAuthService = inject(ProviderAuthService);
    const router = inject(Router);

    if (providerAuthService.isProvider()) {
        return true;
    }

    // Redirigir al login de proveedores preservando la URL de retorno
    return router.createUrlTree(['/auth/provider/login'], {
        queryParams: { returnUrl: state.url }
    });
};
