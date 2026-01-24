import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Cotizacion, CreateCotizacionDto, UpdateCotizacionDto } from '../models/cotizacion.model';

/**
 * Servicio para gestionar cotizaciones
 */
@Injectable({
    providedIn: 'root'
})
export class CotizacionService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/cotizaciones`;
    }

    /**
     * Obtener todas las cotizaciones con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Cotizacion>> {
        return this.get<PaginatedResponse<Cotizacion>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una cotización por ID
     */
    getById(id: number): Observable<{ data: Cotizacion; totales?: any }> {
        return this.get<{ data: Cotizacion; totales?: any }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva cotización
     */
    create(cotizacion: CreateCotizacionDto): Observable<{ data: Cotizacion }> {
        return this.post<{ data: Cotizacion }>(this.getBaseUrl(), cotizacion);
    }

    /**
     * Actualizar una cotización
     */
    update(id: number, cotizacion: UpdateCotizacionDto): Observable<{ data: Cotizacion }> {
        return this.put<{ data: Cotizacion }>(`${this.getBaseUrl()}/${id}`, cotizacion);
    }

    /**
     * Eliminar una cotización
     */
    deleteCotizacion(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
