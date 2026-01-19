import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Invitado
 * 
 * Protege rutas de autenticación (login, register) para que solo
 * usuarios NO autenticados puedan acceder.
 * Si el usuario ya está autenticado, redirige al dashboard.
 * 
 * Uso en rutas:
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Si ya está autenticado, redirigir al dashboard
  router.navigate(['/']);
  return false;
};
