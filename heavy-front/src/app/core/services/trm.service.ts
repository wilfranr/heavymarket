import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { TRM, CreateTRMDto, UpdateTRMDto } from '../models/trm.model';

/**
 * Servicio para gestionar TRM
 */
@Injectable({
    providedIn: 'root'
})
export class TRMService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/trms`;
    }

    /**
     * Obtener todas las TRM con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<TRM>> {
        return this.get<PaginatedResponse<TRM>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener la TRM más reciente
     */
    getLatest(): Observable<{ data: TRM }> {
        return this.get<{ data: TRM }>(`${this.getBaseUrl()}/latest`);
    }

    /**
     * Obtener una TRM por ID
     */
    getById(id: number): Observable<{ data: TRM }> {
        return this.get<{ data: TRM }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva TRM
     */
    create(trm: CreateTRMDto): Observable<{ data: TRM }> {
        return this.post<{ data: TRM }>(this.getBaseUrl(), trm);
    }

    /**
     * Actualizar una TRM
     */
    update(id: number, trm: UpdateTRMDto): Observable<{ data: TRM }> {
        return this.put<{ data: TRM }>(`${this.getBaseUrl()}/${id}`, trm);
    }

    /**
     * Eliminar una TRM
     */
    deleteTRM(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
