import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../models/user.model';

/**
 * Servicio de Autenticación para Proveedores
 *
 * Maneja el inicio de sesión y registro específico para el portal de proveedores.
 */
@Injectable({
    providedIn: 'root'
})
export class ProviderAuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // Signals para manejo de estado reactivo
    currentUser = signal<User | null>(null);
    isAuthenticated = signal<boolean>(false);
    isLoading = signal<boolean>(false);

    private readonly API_URL = `${environment.apiUrl}/auth/provider`;
    private readonly TOKEN_KEY = 'provider_access_token';
    private readonly USER_KEY = 'provider_current_user';

    constructor() {
        this.loadUserFromStorage();
    }

    /**
     * Registrar un nuevo proveedor
     */
    register(data: RegisterData): Observable<AuthResponse> {
        this.isLoading.set(true);

        return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
            tap({
                next: (response) => {
                    this.handleAuthSuccess(response);
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            })
        );
    }

    /**
     * Iniciar sesión como proveedor
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        this.isLoading.set(true);

        return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
            tap({
                next: (response) => {
                    this.handleAuthSuccess(response);
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            })
        );
    }

    /**
     * Cerrar sesión de proveedor
     */
    logout(): void {
        this.clearAuthData();
        this.router.navigate(['/auth/provider/login']);
    }

    /**
     * Obtener el token de acceso almacenado
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Verificar si es un proveedor autenticado
     */
    isProvider(): boolean {
        const user = this.currentUser();
        return this.isAuthenticated() && (user?.roles.includes('Proveedor') ?? false);
    }

    /**
     * Manejar respuesta exitosa de autenticación
     */
    private handleAuthSuccess(response: AuthResponse): void {
        const token = response.data.access_token;
        const user = response.data.user;

        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        this.currentUser.set(user);
        this.isAuthenticated.set(true);
    }

    /**
     * Limpiar datos de autenticación
     */
    private clearAuthData(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
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
                this.isAuthenticated.set(true);
            } catch (error) {
                console.error('Error al cargar proveedor:', error);
                this.clearAuthData();
            }
        }
    }
}
