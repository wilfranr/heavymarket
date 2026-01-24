import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Sistema, CreateSistemaDto, UpdateSistemaDto } from '../models/sistema.model';
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

  /**
   * Obtener todos los sistemas con filtros
   */
  getAll(params?: {
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Observable<PaginatedResponse<Sistema>> {
    return this.get<PaginatedResponse<Sistema>>(this.endpoint, params);
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
  create(data: CreateSistemaDto): Observable<ApiResponse<Sistema>> {
    return this.post<ApiResponse<Sistema>>(this.endpoint, data);
  }

  /**
   * Actualizar un sistema existente
   */
  update(id: number, data: UpdateSistemaDto): Observable<ApiResponse<Sistema>> {
    return this.put<ApiResponse<Sistema>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Eliminar un sistema (soft delete)
   */
  deleteSistema(id: number): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`);
  }
}
