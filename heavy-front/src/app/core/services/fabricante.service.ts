import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Fabricante, CreateFabricanteDto, UpdateFabricanteDto } from '../models/fabricante.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Fabricantes
 *
 * Maneja todas las operaciones CRUD de fabricantes
 */
@Injectable({
    providedIn: 'root'
})
export class FabricanteService extends ApiService {
    private readonly endpoint = 'fabricantes';

    /**
     * Obtener todos los fabricantes con filtros
     */
    getAll(params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Fabricante>> {
        return this.get<PaginatedResponse<Fabricante>>(this.endpoint, params);
    }

    /**
     * Obtener un fabricante por ID
     */
    getById(id: number): Observable<ApiResponse<Fabricante>> {
        return this.get<ApiResponse<Fabricante>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear un nuevo fabricante
     */
    create(data: CreateFabricanteDto): Observable<ApiResponse<Fabricante>> {
        return this.post<ApiResponse<Fabricante>>(this.endpoint, data);
    }

    /**
     * Actualizar un fabricante existente
     */
    update(id: number, data: UpdateFabricanteDto): Observable<ApiResponse<Fabricante>> {
        return this.put<ApiResponse<Fabricante>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar un fabricante
     */
    deleteFabricante(id: number): Observable<any> {
        return this.delete(`${this.endpoint}/${id}`);
    }
}
