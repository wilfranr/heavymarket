import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Lista, CreateListaDto, UpdateListaDto, ListaTipo } from '../models/lista.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

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

    /**
     * Obtener listas por tipo (sin paginación, para dropdowns)
     */
    getByTipo(tipo: ListaTipo): Observable<Lista[]> {
        return this.get<{ data: Lista[] }>(`${this.endpoint}/tipo/${tipo}`).pipe(map((response) => response.data));
    }

    /**
     * Obtener todas las listas con filtros
     */
    getAll(params?: { tipo?: ListaTipo; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Lista>> {
        return this.get<PaginatedResponse<Lista>>(this.endpoint, params);
    }

    /**
     * Obtener una lista por ID
     */
    getById(id: number): Observable<ApiResponse<Lista>> {
        return this.get<ApiResponse<Lista>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear una nueva lista
     */
    create(data: CreateListaDto): Observable<ApiResponse<Lista>> {
        return this.post<ApiResponse<Lista>>(this.endpoint, data);
    }

    /**
     * Actualizar una lista existente
     */
    update(id: number, data: UpdateListaDto): Observable<ApiResponse<Lista>> {
        return this.put<ApiResponse<Lista>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar una lista (soft delete)
     */
    deleteLista(id: number): Observable<any> {
        return this.delete(`${this.endpoint}/${id}`);
    }
}
