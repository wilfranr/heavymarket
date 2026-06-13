import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Lista, CreateListaDto, UpdateListaDto, ListaTipo } from '../models/lista.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/** Clave estable para fusionar Marca vs Fabricantes cuando el mismo nombre tiene dos IDs distintos. */
function claveNombreLista(nombre: string): string {
    return nombre.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Servicio para gestión de Listas
 *
 * Maneja todas las operaciones CRUD de listas (catálogos)
 */
@Injectable({
    providedIn: 'root'
})
export class ListaService extends ApiService {
    private readonly endpoint = 'listas';
    private cache$ = new Map<string, Observable<any>>();

    /**
     * Limpia la caché de listas.
     */
    clearCache(): void {
        this.cache$.clear();
    }

    /**
     * Obtener listas por tipo (sin paginación, para dropdowns).
     * Implementa caché reactiva.
     */
    getByTipo(tipo: ListaTipo, search?: string, limit = 500): Observable<Lista[]> {
        const cacheKey = `getByTipo:${tipo}:${search || ''}:${limit}`;

        if (!this.cache$.has(cacheKey)) {
            const params: Record<string, string | number> = { limit };
            if (search) {
                params['search'] = search;
            }
            const request$ = this.get<{ data: Lista[] }>(`${this.endpoint}/tipo/${encodeURIComponent(tipo)}`, params).pipe(
                map((response) => response.data),
                shareReplay(1)
            );
            this.cache$.set(cacheKey, request$);
        }

        return this.cache$.get(cacheKey)!;
    }

    /**
     * Tipos de artículo para cascada pedido/cotización.
     * Sistema "Por Defecto": todas las listas tipo Tipo de Artículo (sin filtro pivot).
     * Otro sistema: listas asociadas vía pivot o sistema_id legacy.
     */
    getTiposArticuloPorSistema(sistemaId: number, esSistemaPorDefecto: boolean): Observable<Lista[]> {
        if (esSistemaPorDefecto) {
            return this.getByTipo('Tipo de Artículo', undefined, 5000);
        }

        return this.getAll({
            tipo: 'Tipo de Artículo',
            sistema_id: sistemaId,
            per_page: 500,
            sort_by: 'nombre',
            sort_order: 'asc'
        }).pipe(map((response) => response.data));
    }

    /**
     * Opciones unificadas para selects de referencia: listas tipo Marca y Fabricantes.
     * Implementa caché reactiva.
     */
    getMarcasYFabricantesParaReferencia(): Observable<Lista[]> {
        const cacheKey = 'getMarcasYFabricantesParaReferencia';

        if (!this.cache$.has(cacheKey)) {
            const request$ = forkJoin({
                marcas: this.getByTipo('Marca'),
                fabricantes: this.getByTipo('Fabricantes')
            }).pipe(
                map(({ marcas, fabricantes }) => {
                    const porNombre = new Map<string, Lista>();

                    const añadir = (item: Lista, preferirSobreExistente: boolean) => {
                        const key = claveNombreLista(item.nombre);
                        if (key === '') {
                            return;
                        }
                        const prev = porNombre.get(key);
                        if (!prev) {
                            porNombre.set(key, item);
                            return;
                        }
                        if (preferirSobreExistente && prev.tipo !== 'Fabricantes' && item.tipo === 'Fabricantes') {
                            porNombre.set(key, item);
                        }
                    };

                    for (const item of marcas) {
                        añadir(item, false);
                    }
                    for (const item of fabricantes) {
                        añadir(item, true);
                    }

                    return Array.from(porNombre.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
                }),
                shareReplay(1)
            );
            this.cache$.set(cacheKey, request$);
        }

        return this.cache$.get(cacheKey)!;
    }

    /**
     * Obtener todas las listas con filtros.
     * Implementa caché reactiva.
     */
    getAll(params?: { tipo?: ListaTipo; search?: string; sistema_id?: number; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Lista>> {
        const cacheKey = `getAll:${JSON.stringify(params || {})}`;

        if (!this.cache$.has(cacheKey)) {
            const request$ = this.get<PaginatedResponse<Lista>>(this.endpoint, params).pipe(shareReplay(1));
            this.cache$.set(cacheKey, request$);
        }

        return this.cache$.get(cacheKey)!;
    }

    /**
     * Obtener una lista por ID
     */
    getById(id: number): Observable<ApiResponse<Lista>> {
        return this.get<ApiResponse<Lista>>(`${this.endpoint}/${id}`);
    }

    create(data: CreateListaDto | FormData): Observable<ApiResponse<Lista>> {
        this.clearCache();
        return this.post<ApiResponse<ApiResponse<Lista>>>(this.endpoint, data).pipe(map((r) => r.data)) as any;
    }

    /**
     * Actualizar una lista existente
     */
    update(id: number, data: UpdateListaDto | FormData): Observable<ApiResponse<Lista>> {
        this.clearCache();
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            return this.post<ApiResponse<Lista>>(`${this.endpoint}/${id}`, data);
        }
        return this.put<ApiResponse<Lista>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar una lista (soft delete)
     */
    deleteLista(id: number): Observable<any> {
        this.clearCache();
        return this.delete(`${this.endpoint}/${id}`);
    }
}
