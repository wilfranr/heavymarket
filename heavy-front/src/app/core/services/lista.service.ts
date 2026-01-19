import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Lista, CreateListaDto, UpdateListaDto, ListaTipo } from '../models/lista.model';
import { ApiService, PaginatedResponse } from './api.service';

/**
 * Servicio para gestión de Listas
 * 
 * Maneja todas las operaciones CRUD de listas (catálogos)
 */
@Injectable({
  providedIn: 'root'
})
export class ListaService extends ApiService<Lista> {
  protected override baseUrl = 'listas';

  /**
   * Obtener listas por tipo (sin paginación, para dropdowns)
   */
  getByTipo(tipo: ListaTipo): Observable<Lista[]> {
    return this.http.get<{ data: Lista[] }>(`${this.getFullUrl()}/tipo/${tipo}`)
      .pipe(
        this.mapResponse((response) => response.data)
      );
  }

  /**
   * Obtener todas las listas con filtros
   */
  getAll(params?: {
    tipo?: ListaTipo;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Observable<PaginatedResponse<Lista>> {
    return this.get<PaginatedResponse<Lista>>('', params);
  }

  /**
   * Crear una nueva lista
   */
  create(data: CreateListaDto): Observable<Lista> {
    return this.post<Lista>('', data);
  }

  /**
   * Actualizar una lista existente
   */
  update(id: number, data: UpdateListaDto): Observable<Lista> {
    return this.put<Lista>(`${id}`, data);
  }

  /**
   * Eliminar una lista (soft delete)
   */
  deleteLista(id: number): Observable<void> {
    return this.delete<void>(`${id}`);
  }
}
