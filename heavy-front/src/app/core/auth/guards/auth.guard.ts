import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Autenticación
 *
 * Protege rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige al login.
 *
 * Uso en rutas:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    }

    // Guardar la URL a la que intentaba acceder para redirigir después del login
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });

    return false;
};
