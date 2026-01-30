import { createAction, props } from '@ngrx/store';
import { User, LoginCredentials, RegisterData } from '../../../core/auth/models/user.model';

/**
 * Actions de Autenticación
 *
 * Define todas las acciones relacionadas con autenticación
 * en el store de NgRx.
 */

// Login
export const login = createAction('[Auth] Login', props<{ credentials: LoginCredentials }>());

export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; token: string }>());

export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

// Register
export const register = createAction('[Auth] Register', props<{ data: RegisterData }>());

export const registerSuccess = createAction('[Auth] Register Success', props<{ user: User; token: string }>());

export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());

// Logout
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

export const logoutFailure = createAction('[Auth] Logout Failure', props<{ error: string }>());

// Get Current User
export const loadCurrentUser = createAction('[Auth] Load Current User');

export const loadCurrentUserSuccess = createAction('[Auth] Load Current User Success', props<{ user: User }>());

export const loadCurrentUserFailure = createAction('[Auth] Load Current User Failure', props<{ error: string }>());

// Clear Error
export const clearAuthError = createAction('[Auth] Clear Error');
