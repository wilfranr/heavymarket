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
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Solo agregar token si existe y la petición va al API
    if (token && req.url.includes('/api/')) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};
