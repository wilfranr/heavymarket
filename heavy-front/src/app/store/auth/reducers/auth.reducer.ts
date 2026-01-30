import { createReducer, on } from '@ngrx/store';
import { User } from '../../../core/auth/models/user.model';
import * as AuthActions from '../actions/auth.actions';

/**
 * Estado de Autenticación
 */
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Estado inicial
 */
export const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
};

/**
 * Reducer de Autenticación
 */
export const authReducer = createReducer(
    initialState,

    // Login
    on(AuthActions.login, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(AuthActions.loginSuccess, (state, { user, token }) => ({
        ...state,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
    })),

    on(AuthActions.loginFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Register
    on(AuthActions.register, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(AuthActions.registerSuccess, (state, { user, token }) => ({
        ...state,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
    })),

    on(AuthActions.registerFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Logout
    on(AuthActions.logout, (state) => ({
        ...state,
        isLoading: true
    })),

    on(AuthActions.logoutSuccess, () => ({
        ...initialState
    })),

    on(AuthActions.logoutFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Load Current User
    on(AuthActions.loadCurrentUser, (state) => ({
        ...state,
        isLoading: true
    })),

    on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false
    })),

    on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Clear Error
    on(AuthActions.clearAuthError, (state) => ({
        ...state,
        error: null
    }))
);
