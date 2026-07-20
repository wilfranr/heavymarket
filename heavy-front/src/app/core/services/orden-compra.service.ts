import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, ApiService, PaginatedResponse, QueryParams } from './api.service';
import { CreateOrdenCompraDto, OrdenCompra, ReceiveOrdenCompraDto, TransitionOrdenCompraDto, UpdateOrdenCompraDto } from '../models/orden-compra.model';

/**
 * Servicio para gestionar órdenes de compra
 */
@Injectable({
    providedIn: 'root'
})
export class OrdenCompraService extends ApiService {
    protected getBaseUrl(): string {
        return `ordenes-compra`;
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
     * Transicionar explícitamente el estado de una orden de compra
     */
    transition(id: number, data: TransitionOrdenCompraDto): Observable<ApiResponse<OrdenCompra>> {
        return this.patch<ApiResponse<OrdenCompra>>(`${this.getBaseUrl()}/${id}/transition`, data);
    }

    /**
     * Registrar recepción parcial o completa de una orden de compra
     */
    receive(id: number, data: ReceiveOrdenCompraDto): Observable<ApiResponse<OrdenCompra>> {
        return this.post<ApiResponse<OrdenCompra>>(`${this.getBaseUrl()}/${id}/receive`, data);
    }

    /**
     * Eliminar una orden de compra
     */
    deleteOrdenCompra(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
