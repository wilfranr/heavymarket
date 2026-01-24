import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Direccion, CreateDireccionDto, UpdateDireccionDto } from '../models/direccion.model';

/**
 * Servicio para gestionar direcciones
 */
@Injectable({
    providedIn: 'root'
})
export class DireccionService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/direcciones`;
    }

    /**
     * Obtener todas las direcciones con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Direccion>> {
        return this.get<PaginatedResponse<Direccion>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una dirección por ID
     */
    getById(id: number): Observable<{ data: Direccion }> {
        return this.get<{ data: Direccion }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva dirección
     */
    create(direccion: CreateDireccionDto): Observable<{ data: Direccion }> {
        return this.post<{ data: Direccion }>(this.getBaseUrl(), direccion);
    }

    /**
     * Actualizar una dirección
     */
    update(id: number, direccion: UpdateDireccionDto): Observable<{ data: Direccion }> {
        return this.put<{ data: Direccion }>(`${this.getBaseUrl()}/${id}`, direccion);
    }

    /**
     * Eliminar una dirección
     */
    deleteDireccion(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
