import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PedidoArticulo, CreatePedidoArticuloDto, UpdatePedidoArticuloDto } from '../models/pedido.model';

/**
 * Servicio para gestionar artículos de pedidos
 */
@Injectable({
    providedIn: 'root'
})
export class PedidoArticuloService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/pedidos`;
    }

    /**
     * Agregar un artículo a un pedido
     */
    addArticulo(pedidoId: number, articulo: CreatePedidoArticuloDto): Observable<{ data: PedidoArticulo }> {
        return this.post<{ data: PedidoArticulo }>(
            `${this.getBaseUrl()}/${pedidoId}/articulos`,
            articulo
        );
    }

    /**
     * Actualizar un artículo de un pedido
     */
    updateArticulo(
        pedidoId: number,
        articuloId: number,
        cambios: UpdatePedidoArticuloDto
    ): Observable<{ data: PedidoArticulo }> {
        return this.put<{ data: PedidoArticulo }>(
            `${this.getBaseUrl()}/${pedidoId}/articulos/${articuloId}`,
            cambios
        );
    }

    /**
     * Eliminar un artículo de un pedido
     */
    deleteArticulo(pedidoId: number, articuloId: number): Observable<void> {
        return this.delete<void>(
            `${this.getBaseUrl()}/${pedidoId}/articulos/${articuloId}`
        );
    }
}
