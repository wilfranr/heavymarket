import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../reducers/auth.reducer';

/**
 * Selectors de Autenticación
 * 
 * Permiten acceder al estado de autenticación desde los componentes
 */

// Feature Selector
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Selectors básicos
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectToken = createSelector(
  selectAuthState,
  (state) => state.token
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.isLoading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

// Selectors compuestos
export const selectUserRoles = createSelector(
  selectCurrentUser,
  (user) => user?.roles || []
);

export const selectUserPermissions = createSelector(
  selectCurrentUser,
  (user) => user?.permissions || []
);

export const selectUserName = createSelector(
  selectCurrentUser,
  (user) => user?.name || ''
);

export const selectUserEmail = createSelector(
  selectCurrentUser,
  (user) => user?.email || ''
);

// Selector para verificar roles
export const selectHasRole = (role: string) => createSelector(
  selectUserRoles,
  (roles) => roles.includes(role)
);

export const selectHasAnyRole = (requiredRoles: string[]) => createSelector(
  selectUserRoles,
  (roles) => requiredRoles.some(role => roles.includes(role))
);
