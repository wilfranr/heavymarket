import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, ApiResponse, QueryParams } from './api.service';
import { Pedido, CreatePedidoDto, UpdatePedidoDto, PedidoEstado } from '../models/pedido.model';

/**
 * Parámetros de consulta específicos para pedidos
 */
export interface PedidoQueryParams extends QueryParams {
    estado?: PedidoEstado;
    tercero_id?: number;
    fabricante_id?: number;
}

/**
 * Servicio de Pedidos
 *
 * Maneja todas las operaciones CRUD de pedidos
 * y comunicación con el endpoint /api/v1/pedidos
 */
@Injectable({
    providedIn: 'root'
})
export class PedidoService extends ApiService {
    private readonly endpoint = 'pedidos';

    /**
     * Listar pedidos con filtros y paginación
     */
    list(params?: PedidoQueryParams): Observable<PaginatedResponse<Pedido>> {
        return this.get<PaginatedResponse<Pedido>>(this.endpoint, params);
    }

    /**
     * Obtener un pedido por ID
     */
    getById(id: number): Observable<ApiResponse<Pedido>> {
        return this.get<ApiResponse<Pedido>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear un nuevo pedido
     */
    create(data: CreatePedidoDto): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(this.endpoint, data);
    }

    /**
     * Actualizar un pedido existente
     */
    update(id: number, data: UpdatePedidoDto): Observable<ApiResponse<Pedido>> {
        return this.put<ApiResponse<Pedido>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar un pedido
     */
    deletePedido(id: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/${this.endpoint}/${id}`);
    }

    /**
     * Cambiar estado de un pedido
     */
    changeStatus(id: number, estado: PedidoEstado, motivo?: string): Observable<ApiResponse<Pedido>> {
        return this.update(id, { estado, motivo_rechazo: motivo });
    }

    /**
     * Obtener pedidos por tercero
     */
    getByTercero(terceroId: number, params?: QueryParams): Observable<PaginatedResponse<Pedido>> {
        return this.list({ ...params, tercero_id: terceroId });
    }

    /**
     * Obtener pedidos por estado
     */
    getByEstado(estado: PedidoEstado, params?: QueryParams): Observable<PaginatedResponse<Pedido>> {
        return this.list({ ...params, estado });
    }
}
