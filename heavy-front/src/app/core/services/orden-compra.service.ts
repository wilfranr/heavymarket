import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { OrdenCompra, CreateOrdenCompraDto, UpdateOrdenCompraDto } from '../models/orden-compra.model';

/**
 * Servicio para gestionar órdenes de compra
 */
@Injectable({
    providedIn: 'root'
})
export class OrdenCompraService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/ordenes-compra`;
    }

    /**
     * Obtener todas las órdenes de compra con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<OrdenCompra>> {
        return this.get<PaginatedResponse<OrdenCompra>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una orden de compra por ID
     */
    getById(id: number): Observable<{ data: OrdenCompra }> {
        return this.get<{ data: OrdenCompra }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva orden de compra
     */
    create(orden: CreateOrdenCompraDto): Observable<{ data: OrdenCompra }> {
        return this.post<{ data: OrdenCompra }>(this.getBaseUrl(), orden);
    }

    /**
     * Actualizar una orden de compra
     */
    update(id: number, orden: UpdateOrdenCompraDto): Observable<{ data: OrdenCompra }> {
        return this.put<{ data: OrdenCompra }>(`${this.getBaseUrl()}/${id}`, orden);
    }

    /**
     * Eliminar una orden de compra
     */
    deleteOrdenCompra(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
