import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Referencia, CreateReferenciaDto, UpdateReferenciaDto } from '../models/referencia.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Referencias
 * 
 * Maneja todas las operaciones CRUD de referencias
 */
@Injectable({
  providedIn: 'root'
})
export class ReferenciaService extends ApiService {
  private readonly endpoint = 'referencias';

  /**
   * Obtener todas las referencias con filtros
   */
  getAll(params?: {
    search?: string;
    marca_id?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Observable<PaginatedResponse<Referencia>> {
    return this.get<PaginatedResponse<Referencia>>(this.endpoint, params);
  }

  /**
   * Obtener una referencia por ID
   */
  getById(id: number): Observable<ApiResponse<Referencia>> {
    return this.get<ApiResponse<Referencia>>(`${this.endpoint}/${id}`);
  }

  /**
   * Crear una nueva referencia
   */
  create(data: CreateReferenciaDto): Observable<ApiResponse<Referencia>> {
    return this.post<ApiResponse<Referencia>>(this.endpoint, data);
  }

  /**
   * Actualizar una referencia existente
   */
  update(id: number, data: UpdateReferenciaDto): Observable<ApiResponse<Referencia>> {
    return this.put<ApiResponse<Referencia>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Eliminar una referencia
   */
  deleteReferencia(id: number): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`);
  }
}
