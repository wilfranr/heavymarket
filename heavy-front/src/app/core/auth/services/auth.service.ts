import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, AuthResponse, LoginCredentials, RegisterData, AccessToken } from '../models/user.model';

/**
 * Servicio de Autenticación
 *
 * Maneja todas las operaciones de autenticación con el backend:
 * - Login/Logout
 * - Registro
 * - Gestión de tokens
 * - Estado del usuario autenticado
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // Signals para manejo de estado reactivo (Angular 20)
    currentUser = signal<User | null>(null);
    isAuthenticated = signal<boolean>(false);
    isLoading = signal<boolean>(false);

    // BehaviorSubject para compatibilidad con código que usa Observables
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_KEY = 'access_token';
    private readonly USER_KEY = 'current_user';

    constructor() {
        this.loadUserFromStorage();
    }

    /**
     * Registrar un nuevo usuario
     */
    register(data: RegisterData): Observable<AuthResponse> {
        this.isLoading.set(true);

        return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
            tap((response) => {
                this.handleAuthSuccess(response);
                this.isLoading.set(false);
            })
        );
    }

    /**
     * Iniciar sesión
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        this.isLoading.set(true);

        // Si no se especifica device_name, usar el user agent del navegador
        if (!credentials.device_name) {
            credentials.device_name = this.getDeviceName();
        }

        return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
            tap((response) => {
                this.handleAuthSuccess(response);
                this.isLoading.set(false);
            })
        );
    }

    /**
     * Cerrar sesión
     */
    logout(): Observable<any> {
        return this.http.post(`${this.API_URL}/logout`, {}).pipe(
            tap(() => {
                this.clearAuthData();
                this.router.navigate(['/auth/login']);
            })
        );
    }

    /**
     * Cerrar sesión en todos los dispositivos
     */
    logoutAll(): Observable<any> {
        return this.http.post(`${this.API_URL}/logout-all`, {}).pipe(
            tap(() => {
                this.clearAuthData();
                this.router.navigate(['/auth/login']);
            })
        );
    }

    /**
     * Obtener información del usuario autenticado
     */
    me(): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.API_URL}/me`).pipe(
            tap((response) => {
                this.setUser(response.data);
            })
        );
    }

    /**
     * Refrescar el token de acceso
     */
    refreshToken(): Observable<{ data: { access_token: string } }> {
        return this.http.post<{ data: { access_token: string } }>(`${this.API_URL}/refresh`, {}).pipe(
            tap((response) => {
                this.setToken(response.data.access_token);
            })
        );
    }

    /**
     * Listar tokens activos del usuario
     */
    listTokens(): Observable<{ data: AccessToken[]; total: number }> {
        return this.http.get<{ data: AccessToken[]; total: number }>(`${this.API_URL}/tokens`);
    }

    /**
     * Revocar un token específico
     */
    revokeToken(tokenId: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/tokens/${tokenId}`);
    }

    /**
     * Obtener el token de acceso almacenado
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isLoggedIn(): boolean {
        return this.isAuthenticated();
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(role: string): boolean {
        const user = this.currentUser();
        return user?.roles.includes(role) ?? false;
    }

    /**
     * Verificar si el usuario tiene alguno de los roles
     */
    hasAnyRole(roles: string[]): boolean {
        return roles.some((role) => this.hasRole(role));
    }

    /**
     * Verificar si el usuario tiene todos los roles
     */
    hasAllRoles(roles: string[]): boolean {
        return roles.every((role) => this.hasRole(role));
    }

    /**
     * Manejar respuesta exitosa de autenticación
     */
    private handleAuthSuccess(response: AuthResponse): void {
        this.setToken(response.data.access_token);
        this.setUser(response.data.user);
    }

    /**
     * Guardar token en localStorage
     */
    private setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Guardar usuario en localStorage y actualizar estado
     */
    private setUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
    }

    /**
     * Limpiar datos de autenticación
     */
    private clearAuthData(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.currentUserSubject.next(null);
        this.isAuthenticated.set(false);
    }

    /**
     * Cargar usuario desde localStorage al iniciar
     */
    private loadUserFromStorage(): void {
        const token = this.getToken();
        const userJson = localStorage.getItem(this.USER_KEY);

        if (token && userJson) {
            try {
                const user: User = JSON.parse(userJson);
                this.currentUser.set(user);
                this.currentUserSubject.next(user);
                this.isAuthenticated.set(true);
            } catch (error) {
                console.error('Error al cargar usuario:', error);
                this.clearAuthData();
            }
        }
    }

    /**
     * Obtener nombre del dispositivo (navegador)
     */
    private getDeviceName(): string {
        return navigator.userAgent || 'Unknown Device';
    }
}
