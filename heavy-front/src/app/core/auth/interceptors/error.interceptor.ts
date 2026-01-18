import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

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

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token inválido o expirado - redirigir al login
        authService.logout().subscribe();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }

      if (error.status === 403) {
        console.error('Acceso denegado:', error.error?.message);
        // Aquí se podría mostrar un toast o mensaje
      }

      if (error.status === 500) {
        console.error('Error del servidor:', error.error?.message);
        // Aquí se podría mostrar un toast o mensaje
      }

      return throwError(() => error);
    })
  );
};
