import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Articulo, CreateArticuloDto, UpdateArticuloDto } from '../models/articulo.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Artículos
 * 
 * Maneja todas las operaciones CRUD de artículos
 */
@Injectable({
  providedIn: 'root'
})
export class ArticuloService extends ApiService {
  private readonly endpoint = 'articulos';

  /**
   * Obtener todos los artículos con filtros
   */
  getAll(params?: {
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Observable<PaginatedResponse<Articulo>> {
    return this.get<PaginatedResponse<Articulo>>(this.endpoint, params);
  }

  /**
   * Obtener un artículo por ID
   */
  getById(id: number): Observable<ApiResponse<Articulo>> {
    return this.get<ApiResponse<Articulo>>(`${this.endpoint}/${id}`);
  }

  /**
   * Crear un nuevo artículo
   */
  create(data: CreateArticuloDto): Observable<ApiResponse<Articulo>> {
    return this.post<ApiResponse<Articulo>>(this.endpoint, data);
  }

  /**
   * Actualizar un artículo existente
   */
  update(id: number, data: UpdateArticuloDto): Observable<ApiResponse<Articulo>> {
    return this.put<ApiResponse<Articulo>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Eliminar un artículo
   */
  deleteArticulo(id: number): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`);
  }
}
