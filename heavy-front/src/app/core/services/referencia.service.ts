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
    getAll(params?: { search?: string; marca_id?: number; articulo_id?: number; disponibles?: boolean; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number; es_temporal?: boolean }): Observable<PaginatedResponse<Referencia>> {
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
     * Buscar solo referencias ya existentes por lotes (no crea registros).
     */
    bulkSearch(items: { codigo: string; cantidad: number }[]): Observable<{
        data: any[];
        no_encontrados?: string[];
        message?: string;
    }> {
        return this.post<{ data: any[]; no_encontrados?: string[]; message?: string }>(`${this.endpoint}/bulk-search`, { items });
    }

    /**
     * Buscar o crear referencias por lotes
     */
    bulkSearchOrCreate(
        items: { codigo: string; cantidad: number }[],
        esTemporal: boolean = false,
        marcaId: number | null = null,
        comentarioTemporal?: string,
        articuloId: number | null = null,
        listaId: number | null = null
    ): Observable<ApiResponse<any[]>> {
        const payload: any = { items, es_temporal: esTemporal };
        if (marcaId) {
            payload.marca_id = marcaId;
        }
        if (articuloId) {
            payload.articulo_id = articuloId;
        }
        if (listaId) {
            payload.lista_id = listaId;
        }
        if (comentarioTemporal) {
            payload.comentario_temporal = comentarioTemporal;
        }
        return this.post<ApiResponse<any[]>>(`${this.endpoint}/bulk-search-or-create`, payload);
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
