import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../models/categoria.model';

/**
 * Servicio para gestionar categorías
 */
@Injectable({
    providedIn: 'root'
})
export class CategoriaService extends ApiService {
    protected readonly endpoint = 'categorias';

    /**
     * Obtener todas las categorías con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Categoria>> {
        return this.get<PaginatedResponse<Categoria>>(this.endpoint, params);
    }

    /**
     * Obtener una categoría por ID
     */
    getById(id: number): Observable<{ data: Categoria }> {
        return this.get<{ data: Categoria }>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear una nueva categoría
     */
    create(categoria: CreateCategoriaDto): Observable<{ data: Categoria }> {
        return this.post<{ data: Categoria }>(this.endpoint, categoria);
    }

    /**
     * Actualizar una categoría
     */
    update(id: number, categoria: UpdateCategoriaDto): Observable<{ data: Categoria }> {
        return this.put<{ data: Categoria }>(`${this.endpoint}/${id}`, categoria);
    }

    /**
     * Eliminar una categoría
     */
    deleteCategoria(id: number): Observable<void> {
        return this.delete<void>(`${this.endpoint}/${id}`);
    }
}
