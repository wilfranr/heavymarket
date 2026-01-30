/**
 * Modelo de Usuario
 *
 * Representa la información del usuario autenticado en el sistema.
 */
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: string[];
    permissions: string[];
}

/**
 * Modelo de respuesta de autenticación (Login/Register)
 */
export interface AuthResponse {
    message: string;
    data: {
        user: User;
        access_token: string;
        token_type: string;
        expires_in: number;
    };
}

/**
 * Modelo de credenciales de login
 */
export interface LoginCredentials {
    email: string;
    password: string;
    device_name?: string;
}

/**
 * Modelo de datos de registro
 */
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    device_name?: string;
}

/**
 * Modelo de token de acceso
 */
export interface AccessToken {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
    expires_at: string | null;
}
