import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ProviderAuthService } from '../services/provider-auth.service';
import { AuthService } from '../services/auth.service';

/**
 * Guardia de ruta para el Portal de Proveedores
 *
 * Asegura que solo los proveedores autenticados puedan acceder a las rutas.
 */
export const providerGuard: CanActivateFn = (route, state) => {
    const providerAuthService = inject(ProviderAuthService);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Permitir si es sesión de proveedor específica O si tiene rol de proveedor en sesión general
    if (providerAuthService.isProvider() || authService.hasAnyRole(['Proveedor', 'proveedor'])) {
        return true;
    }

    // Redirigir al login unificado si no tiene permisos
    return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
};
