import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { ApproveCotizacionDto, Cotizacion, CreateCotizacionDto, UpdateCotizacionDto } from '../models/cotizacion.model';

/**
 * Servicio para gestionar cotizaciones
 */
@Injectable({
    providedIn: 'root'
})
export class CotizacionService extends ApiService {
    protected getBaseUrl(): string {
        return `cotizaciones`;
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
    /**
     * Finalizar costeo y generar cotización
     */
    finalizarCosteo(data: { pedido_id: number; items: { id: number; mostrar_referencia: boolean }[]; observaciones?: string }): Observable<{ data: Cotizacion; message: string }> {
        return this.post<{ data: Cotizacion; message: string }>(`${this.getBaseUrl()}/finalizar-costeo`, data);
    }

    /**
     * Descargar PDF de la cotización
     */
    downloadPDF(id: number): Observable<Blob> {
        return this.http.get(this.formatUrl(`${this.getBaseUrl()}/${id}/download-pdf`), {
            responseType: 'blob'
        });
    }

    /**
     * Aprobar una cotización
     */
    approve(id: number, data: ApproveCotizacionDto = {}): Observable<{ data: Cotizacion; message: string }> {
        return this.post<{ data: Cotizacion; message: string }>(`${this.getBaseUrl()}/${id}/approve`, data);
    }

    /**
     * Rechazar una cotización
     */
    reject(id: number, motivo?: string): Observable<{ data: Cotizacion; message: string }> {
        return this.post<{ data: Cotizacion; message: string }>(`${this.getBaseUrl()}/${id}/reject`, { motivo });
    }
}
