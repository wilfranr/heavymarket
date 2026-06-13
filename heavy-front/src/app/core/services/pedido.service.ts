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
    update(id: number, data: UpdatePedidoDto | FormData): Observable<ApiResponse<Pedido>> {
        // multipart/form-data con HTTP PUT suele no parsearse bien en PHP/Laravel; mismo criterio que Maquina/Articulo.
        if (data instanceof FormData) {
            if (![...data.keys()].includes('_method')) {
                data.append('_method', 'PUT');
            }
            return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}`, data);
        }
        return this.put<ApiResponse<Pedido>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar un pedido (Borrado físico - Usar con precaución)
     */
    deletePedido(id: number): Observable<void> {
        return this.delete<void>(`${this.endpoint}/${id}`);
    }

    /**
     * Cancelar un pedido (Borrado lógico vía cambio de estado)
     */
    cancelar(id: number, motivo: string): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/cancelar`, { motivo });
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
    /**
     * Enviar pedido a fase de costeo (Acción del Analista)
     */
    enviarACosteo(id: number): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/enviar-a-costeo`, {});
    }

    /**
     * Enviar pedido a análisis (sin FormData; el estado se persiste siempre en el servidor).
     */
    enviarAAnalisis(id: number): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/enviar-a-analisis`, {});
    }

    /**
     * Devolver pedido al vendedor (Analista devuelve a Nuevo)
     */
    devolverAVendedor(id: number, comentario: string, payload?: any): Observable<ApiResponse<Pedido>> {
        const body = { comentario, ...(payload || {}) };
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/devolver-vendedor`, body);
    }

    /**
     * Devolver pedido al analista (Vendedor/Asesor devuelve a En_Analisis)
     */
    devolverAAnalista(id: number, comentario: string): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/devolver-analista`, { comentario });
    }

    /**
     * Devolver pedido a costeo desde Cotizado (recosteo sin items nuevos)
     */
    devolverACosteo(id: number, comentario: string): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/devolver-a-costeo`, { comentario });
    }

    /**
     * Marcar pedido como enviado (Aprobado -> Enviado)
     */
    enviarPedido(id: number): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/enviar`, {});
    }

    /**
     * Marcar pedido como entregado (Enviado -> Entregado)
     */
    entregarPedido(id: number): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/entregar`, {});
    }

    /**
     * Responder pedido (aprobar/rechazar) desde Cotizado
     */
    responderPedido(id: number, respuesta: 'aprobar' | 'rechazar', comentario?: string): Observable<ApiResponse<Pedido>> {
        return this.post<ApiResponse<Pedido>>(`${this.endpoint}/${id}/responder`, { respuesta, comentario });
    }

    /**
     * Guardar datos de costeo de forma masiva
     */
    guardarCosteo(id: number, data: any): Observable<ApiResponse<any>> {
        return this.post<ApiResponse<any>>(`${this.endpoint}/${id}/guardar-costeo`, data);
    }
}
