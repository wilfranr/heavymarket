import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Roles
 *
 * Protege rutas que requieren roles específicos.
 *
 * Uso en rutas:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard],
 *   data: { roles: ['super_admin', 'Administrador'] }
 * }
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = route.data?.['roles'] as string[];

    if (!authService.isLoggedIn()) {
        router.navigate(['/auth/login']);
        return false;
    }

    if (requiredRoles && requiredRoles.length > 0) {
        if (authService.hasAnyRole(requiredRoles)) {
            return true;
        }

        // Usuario no tiene los roles necesarios
        router.navigate(['/access-denied']);
        return false;
    }

    return true;
};
