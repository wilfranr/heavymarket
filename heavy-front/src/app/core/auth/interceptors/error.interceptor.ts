import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ProviderAuthService } from '../services/provider-auth.service';

/**
 * Interceptor de Errores HTTP
 *
 * Maneja los errores HTTP de forma global:
 * - 401: Redirige al login
 * - 403: Muestra mensaje de sin permisos
 * - 500: Muestra mensaje de error del servidor
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const providerAuthService = inject(ProviderAuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Manejar errores de autenticación
            if (error.status === 401) {
                // Identificar si la petición era del portal de proveedores
                const isProviderRequest = req.url.includes('/provider/');
                const loginRoute = isProviderRequest ? '/auth/provider/login' : '/auth/login';

                // Evitar bucle infinito si la propia petición de logout falla
                if (req.url.includes('/logout')) {
                    if (isProviderRequest) {
                        localStorage.removeItem('provider_access_token');
                        localStorage.removeItem('provider_current_user');
                    } else {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('current_user');
                    }

                    if (!router.url.includes(loginRoute)) {
                        router.navigate([loginRoute], {
                            queryParams: { returnUrl: router.url }
                        });
                    }
                    return throwError(() => error);
                }

                // Si el error viene de una ruta pública de la landing o de ubicaciones, no redirigimos
                if (req.url.includes('/landing/') || req.url.includes('/ubicaciones/')) {
                    return throwError(() => error);
                }

                // Rutas públicas que no deben redirigir al login en caso de 401
                if (req.url.includes('/cotizar') || req.url.includes('/auth/') || req.url.includes('/landing/') || req.url.includes('/me') || req.url.includes('/ubicaciones/')) {
                    return throwError(() => error);
                }

                // Token inválido o expirado - redirigir al login
                if (!router.url.includes(loginRoute)) {
                    if (isProviderRequest) {
                        providerAuthService.logout();
                    } else {
                        authService.logout().subscribe({
                            error: () => {
                                localStorage.removeItem('access_token');
                                localStorage.removeItem('current_user');
                            }
                        });
                    }

                    router.navigate([loginRoute], {
                        queryParams: { returnUrl: router.url }
                    });
                }
            }

            // Solo loggear errores que no sean de validación (422)
            // Los 422 deben ser manejados por el componente
            if (error.status === 403) {
                console.error('Acceso denegado:', error.error?.message);
            }

            if (error.status === 500) {
                console.error('Error del servidor:', error.error?.message);
            }

            // No loggear errores manejados localmente por los componentes:
            // - 422: validación
            // - 404 en /trms/latest: caso esperado cuando no hay TRM registrada
            const silent404Routes = ['/trms/latest'];
            const isSilent404 = error.status === 404 && silent404Routes.some(route => req.url.includes(route));

            if (error.status !== 422 && !isSilent404) {
                console.error('Error HTTP:', error.status, error.message);
            }

            return throwError(() => error);
        })
    );
};
