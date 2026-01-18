import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, ApiResponse, QueryParams } from './api.service';
import { Tercero, CreateTerceroDto, UpdateTerceroDto, TipoTercero } from '../models/tercero.model';

/**
 * Parámetros de consulta específicos para terceros
 */
export interface TerceroQueryParams extends QueryParams {
  tipo_tercero?: TipoTercero;
  es_cliente?: boolean;
  es_proveedor?: boolean;
}

/**
 * Servicio de Terceros
 * 
 * Maneja todas las operaciones CRUD de terceros (clientes/proveedores)
 * y comunicación con el endpoint /api/v1/terceros
 */
@Injectable({
  providedIn: 'root'
})
export class TerceroService extends ApiService {
  private readonly endpoint = 'terceros';

  /**
   * Listar terceros con filtros y paginación
   */
  list(params?: TerceroQueryParams): Observable<PaginatedResponse<Tercero>> {
    return this.get<PaginatedResponse<Tercero>>(this.endpoint, params);
  }

  /**
   * Obtener un tercero por ID
   */
  getById(id: number): Observable<ApiResponse<Tercero>> {
    return this.get<ApiResponse<Tercero>>(`${this.endpoint}/${id}`);
  }

  /**
   * Crear un nuevo tercero
   */
  create(data: CreateTerceroDto): Observable<ApiResponse<Tercero>> {
    return this.post<ApiResponse<Tercero>>(this.endpoint, data);
  }

  /**
   * Actualizar un tercero existente
   */
  update(id: number, data: UpdateTerceroDto): Observable<ApiResponse<Tercero>> {
    return this.put<ApiResponse<Tercero>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Eliminar un tercero
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${this.endpoint}/${id}`);
  }

  /**
   * Obtener solo clientes activos
   */
  getClientes(params?: QueryParams): Observable<PaginatedResponse<Tercero>> {
    return this.list({ ...params, es_cliente: true });
  }

  /**
   * Obtener solo proveedores activos
   */
  getProveedores(params?: QueryParams): Observable<PaginatedResponse<Tercero>> {
    return this.list({ ...params, es_proveedor: true });
  }

  /**
   * Buscar terceros por nombre o documento
   */
  search(searchTerm: string, params?: QueryParams): Observable<PaginatedResponse<Tercero>> {
    return this.list({ ...params, search: searchTerm });
  }
}
