import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Parámetros de consulta para listados
 */
export interface QueryParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    search?: string;
    [key: string]: any;
}

/**
 * Respuesta paginada del API
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/**
 * Respuesta estándar del API
 */
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

/**
 * Servicio Base para API
 *
 * Proporciona métodos genéricos para interactuar con el backend API.
 * Todos los servicios de recursos deben extender este servicio.
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    protected http = inject(HttpClient);
    protected readonly API_URL = environment.apiUrl;

    /**
     * GET: Obtener un recurso
     */
    protected get<T>(endpoint: string, params?: QueryParams): Observable<T> {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<T>(`${this.API_URL}/${endpoint}`, { params: httpParams });
    }

    /**
     * POST: Crear un recurso
     */
    protected post<T>(endpoint: string, data: any): Observable<T> {
        return this.http.post<T>(`${this.API_URL}/${endpoint}`, data);
    }

    /**
     * PUT: Actualizar un recurso completo
     */
    protected put<T>(endpoint: string, data: any): Observable<T> {
        return this.http.put<T>(`${this.API_URL}/${endpoint}`, data);
    }

    /**
     * PATCH: Actualizar parcialmente un recurso
     */
    protected patch<T>(endpoint: string, data: any): Observable<T> {
        return this.http.patch<T>(`${this.API_URL}/${endpoint}`, data);
    }

    /**
     * DELETE: Eliminar un recurso
     */
    protected delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.API_URL}/${endpoint}`);
    }

    /**
     * Construir HttpParams desde QueryParams
     */
    private buildHttpParams(params?: QueryParams): HttpParams {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value !== undefined && value !== null && value !== '') {
                    httpParams = httpParams.set(key, String(value));
                }
            });
        }

        return httpParams;
    }
}
