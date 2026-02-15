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

    // Obtener tokens simulando la lógica de negocio adecuada
    const adminToken = authService.getToken();
    const landingToken = localStorage.getItem('clientToken');

    let token = null;

    // Prioridad: 
    // 1. Admin Token (si existe, el usuario es administrador y debería tener acceso a todo)
    // 2. Landing Token (si no es admin, pero tiene token de cliente y va a rutas de landing)
    if (adminToken) {
        token = adminToken;
    } else if (req.url.includes('/landing/')) {
        token = landingToken;
    }

    // Solo agregar token si existe y la petición va al API
    if (token && req.url.includes('/v1/')) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};
