import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Sistema, CreateSistemaDto, UpdateSistemaDto, SyncSistemaTiposArticuloDto } from '../models/sistema.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Sistemas
 *
 * Maneja todas las operaciones CRUD de sistemas
 */
@Injectable({
    providedIn: 'root'
})
export class SistemaService extends ApiService {
    private readonly endpoint = 'sistemas';
    private cache$ = new Map<string, Observable<PaginatedResponse<Sistema>>>();

    /**
     * Obtener todos los sistemas con filtros.
     * Implementa caché reactiva para optimizar peticiones repetitivas de catálogos.
     */
    getAll(params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number; include?: string }): Observable<PaginatedResponse<Sistema>> {
        const cacheKey = JSON.stringify(params || {});

        if (!this.cache$.has(cacheKey)) {
            const request$ = this.get<PaginatedResponse<Sistema>>(this.endpoint, params).pipe(shareReplay(1));
            this.cache$.set(cacheKey, request$);
        }

        return this.cache$.get(cacheKey)!;
    }

    /**
     * Limpia la caché de sistemas.
     */
    clearCache(): void {
        this.cache$.clear();
    }

    /**
     * Obtener un sistema por ID
     */
    getById(id: number): Observable<ApiResponse<Sistema>> {
        return this.get<ApiResponse<Sistema>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear un nuevo sistema
     */
    create(data: CreateSistemaDto | FormData): Observable<ApiResponse<Sistema>> {
        this.clearCache();
        return this.post<ApiResponse<Sistema>>(this.endpoint, data);
    }

    /**
     * Actualizar un sistema existente
     */
    update(id: number, data: UpdateSistemaDto | FormData): Observable<ApiResponse<Sistema>> {
        this.clearCache();
        if (data instanceof FormData) {
            // Spoofing PUT method for Laravel with FormData
            data.append('_method', 'PUT');
            return this.post<ApiResponse<Sistema>>(`${this.endpoint}/${id}`, data);
        }
        return this.put<ApiResponse<Sistema>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar un sistema (soft delete)
     */
    deleteSistema(id: number): Observable<any> {
        this.clearCache();
        return this.delete(`${this.endpoint}/${id}`);
    }

    /**
     * Sincroniza los tipos de artículo (listas) asociados a un sistema.
     */
    syncTiposArticulo(id: number, data: SyncSistemaTiposArticuloDto): Observable<ApiResponse<Sistema>> {
        this.clearCache();
        return this.put<ApiResponse<Sistema>>(`${this.endpoint}/${id}/tipos-articulo`, data);
    }
}
