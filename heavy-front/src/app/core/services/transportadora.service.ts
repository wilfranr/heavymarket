import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Transportadora, CreateTransportadoraDto, UpdateTransportadoraDto } from '../models/transportadora.model';

/**
 * Servicio para gestionar transportadoras
 */
@Injectable({
    providedIn: 'root'
})
export class TransportadoraService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/transportadoras`;
    }

    /**
     * Obtener todas las transportadoras con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Transportadora>> {
        return this.get<PaginatedResponse<Transportadora>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una transportadora por ID
     */
    getById(id: number): Observable<{ data: Transportadora }> {
        return this.get<{ data: Transportadora }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva transportadora
     */
    create(transportadora: CreateTransportadoraDto): Observable<{ data: Transportadora }> {
        return this.post<{ data: Transportadora }>(this.getBaseUrl(), transportadora);
    }

    /**
     * Actualizar una transportadora
     */
    update(id: number, transportadora: UpdateTransportadoraDto): Observable<{ data: Transportadora }> {
        return this.put<{ data: Transportadora }>(`${this.getBaseUrl()}/${id}`, transportadora);
    }

    /**
     * Eliminar una transportadora
     */
    deleteTransportadora(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
