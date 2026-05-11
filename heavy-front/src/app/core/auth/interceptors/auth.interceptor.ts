import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de Autenticación
 *
 * Agrega automáticamente el token Bearer a todas las peticiones HTTP
 * que van hacia el backend API.
 *
 * Uso: Agregar en app.config.ts como provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Si la petición ya tiene header de autorización, no hacer nada
    if (req.headers.has('Authorization')) {
        return next(req);
    }

    const authService = inject(AuthService);

    // Obtener tokens de las diferentes sesiones
    const adminToken = authService.getToken();
    const providerToken = localStorage.getItem('provider_access_token');
    const landingToken = localStorage.getItem('clientToken');

    let token = null;

    // Lógica de selección de token (Prioridad por contexto)
    if (adminToken) {
        token = adminToken;
    } else if (providerToken && req.url.includes('/provider/')) {
        token = providerToken;
    } else if (landingToken && req.url.includes('/landing/')) {
        token = landingToken;
    }

    // Solo agregar token si existe y la petición va al API v1
    if (token && req.url.includes('/v1/')) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};
