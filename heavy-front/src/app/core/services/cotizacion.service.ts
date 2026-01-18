import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Cotizacion, CreateCotizacionDto, UpdateCotizacionDto } from '../models/cotizacion.model';

/**
 * Servicio para gestionar cotizaciones
 */
@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private readonly api = inject(ApiService);
    private readonly endpoint = '/cotizaciones';

    list(params?: QueryParams): Observable<PaginatedResponse<Cotizacion>> {
        return this.api.get<PaginatedResponse<Cotizacion>>(this.endpoint, params);
    }

    getById(id: number): Observable<Cotizacion> {
        return this.api.get<Cotizacion>(`${this.endpoint}/${id}`);
    }

    create(cotizacion: CreateCotizacionDto): Observable<Cotizacion> {
        return this.api.post<Cotizacion>(this.endpoint, cotizacion);
    }

    update(id: number, cotizacion: UpdateCotizacionDto): Observable<Cotizacion> {
        return this.api.put<Cotizacion>(`${this.endpoint}/${id}`, cotizacion);
    }

    delete(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }
}
