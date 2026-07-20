import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { OrdenTrabajo, CreateOrdenTrabajoDto, UpdateOrdenTrabajoDto } from '../models/orden-trabajo.model';
import { CreateRecepcionCompraDto, RecepcionCompra } from '../models/recepcion-compra.model';

/**
 * Servicio para gestionar órdenes de trabajo
 */
@Injectable({
    providedIn: 'root'
})
export class OrdenTrabajoService extends ApiService {
    protected getBaseUrl(): string {
        return `ordenes-trabajo`;
    }

    /**
     * Obtener todas las órdenes de trabajo con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<OrdenTrabajo>> {
        return this.get<PaginatedResponse<OrdenTrabajo>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una orden de trabajo por ID
     */
    getById(id: number): Observable<{ data: OrdenTrabajo }> {
        return this.get<{ data: OrdenTrabajo }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva orden de trabajo
     */
    create(orden: CreateOrdenTrabajoDto): Observable<{ data: OrdenTrabajo }> {
        return this.post<{ data: OrdenTrabajo }>(this.getBaseUrl(), orden);
    }

    /**
     * Actualizar una orden de trabajo
     */
    update(id: number, orden: UpdateOrdenTrabajoDto): Observable<{ data: OrdenTrabajo }> {
        return this.put<{ data: OrdenTrabajo }>(`${this.getBaseUrl()}/${id}`, orden);
    }

    /**
     * Registrar recepción física de repuestos desde la orden de trabajo
     */
    registrarRecepcionCompra(id: number, data: CreateRecepcionCompraDto): Observable<{ data: RecepcionCompra }> {
        return this.post<{ data: RecepcionCompra }>(`${this.getBaseUrl()}/${id}/recepciones-compra`, data);
    }

    /**
     * Eliminar una orden de trabajo
     */
    deleteOrdenTrabajo(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
