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
export class OrdenCompraService {
    private readonly api = inject(ApiService);
    private readonly endpoint = '/ordenes-compra';

    list(params?: QueryParams): Observable<PaginatedResponse<OrdenCompra>> {
        return this.api.get<PaginatedResponse<OrdenCompra>>(this.endpoint, params);
    }

    getById(id: number): Observable<OrdenCompra> {
        return this.api.get<OrdenCompra>(`${this.endpoint}/${id}`);
    }

    create(orden: CreateOrdenCompraDto): Observable<OrdenCompra> {
        return this.api.post<OrdenCompra>(this.endpoint, orden);
    }

    update(id: number, orden: UpdateOrdenCompraDto): Observable<OrdenCompra> {
        return this.api.put<OrdenCompra>(`${this.endpoint}/${id}`, orden);
    }

    delete(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }
}
