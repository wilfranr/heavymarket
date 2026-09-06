import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ApiService, PaginatedResponse, QueryParams } from './api.service';
import { CreateOrdenCompraDto, OrdenCompra, ReceiveOrdenCompraDto, TransitionOrdenCompraDto, UpdateOrdenCompraDto } from '../models/orden-compra.model';
import { RecepcionCompra, RecepcionCompraImagen, RecepcionCompraImagenTipo, RegistrarRecepcionPayload } from '../models/recepcion-compra.model';

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

    /**
     * Registrar una recepción de mercancía directamente desde la Orden de Compra
     */
    registrarRecepcion(ordenCompraId: number, payload: RegistrarRecepcionPayload): Observable<RecepcionCompra> {
        return this.post<ApiResponse<RecepcionCompra>>(`${this.getBaseUrl()}/${ordenCompraId}/recepciones`, payload).pipe(map((response) => response.data));
    }

    /**
     * Listar el historial de entregas (recepciones) de una Orden de Compra
     */
    listarRecepciones(ordenCompraId: number): Observable<RecepcionCompra[]> {
        return this.get<ApiResponse<RecepcionCompra[]>>(`${this.getBaseUrl()}/${ordenCompraId}/recepciones`).pipe(map((response) => response.data));
    }

    /**
     * Adjuntar una foto o guía de transportadora a una recepción registrada
     */
    adjuntarImagenRecepcion(recepcionId: number, file: File, tipo: RecepcionCompraImagenTipo): Observable<RecepcionCompraImagen> {
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('tipo', tipo);

        return this.http.post<ApiResponse<RecepcionCompraImagen>>(this.formatUrl(`recepciones-compra/${recepcionId}/imagenes`), formData).pipe(map((response) => response.data));
    }

    /**
     * Subir comprobante de pago de una orden de compra
     */
    uploadComprobantePago(ordenCompraId: number, file: File): Observable<{ success: boolean; file_url: string; file_name: string; original_name: string }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<{ success: boolean; file_url: string; file_name: string; original_name: string }>(this.formatUrl(`${this.getBaseUrl()}/${ordenCompraId}/upload-comprobante`), formData);
    }
}
