import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import * as AuthActions from '../actions/auth.actions';

/**
 * Effects de Autenticación
 * 
 * Maneja las operaciones asíncronas relacionadas con autenticación
 * (llamadas al API, navegación, etc.)
 */
@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Effect: Login
   */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map(response =>
            AuthActions.loginSuccess({
              user: response.data.user,
              token: response.data.access_token
            })
          ),
          catchError(error =>
            of(AuthActions.loginFailure({
              error: error.error?.message || 'Error al iniciar sesión'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Login Success - Redirigir al dashboard
   */
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Effect: Register
   */
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ data }) =>
        this.authService.register(data).pipe(
          map(response =>
            AuthActions.registerSuccess({
              user: response.data.user,
              token: response.data.access_token
            })
          ),
          catchError(error =>
            of(AuthActions.registerFailure({
              error: error.error?.message || 'Error al registrar usuario'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Register Success - Redirigir al dashboard
   */
  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Effect: Logout
   */
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(error =>
            of(AuthActions.logoutFailure({
              error: error.error?.message || 'Error al cerrar sesión'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Logout Success - Redirigir al login
   */
  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Effect: Load Current User
   */
  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() =>
        this.authService.me().pipe(
          map(response =>
            AuthActions.loadCurrentUserSuccess({ user: response.data })
          ),
          catchError(error =>
            of(AuthActions.loadCurrentUserFailure({
              error: error.error?.message || 'Error al cargar usuario'
            }))
          )
        )
      )
    )
  );
}
