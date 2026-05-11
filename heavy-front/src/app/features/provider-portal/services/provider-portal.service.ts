import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, ApiResponse, QueryParams } from '../../../core/services/api.service';

/**
 * Servicio para el Portal de Proveedores
 */
@Injectable({
    providedIn: 'root'
})
export class ProviderPortalService extends ApiService {
    private readonly endpoint = '/v1/provider';

    /**
     * Obtener oportunidades de costeo filtradas por especialidad
     */
    getOpportunities(params: QueryParams = {}): Observable<PaginatedResponse<any>> {
        return this.get<PaginatedResponse<any>>(`${this.endpoint}/opportunities`, params);
    }

    /**
     * Enviar oferta de costeo para una referencia
     */
    submitCost(data: { pedido_referencia_id: number; costo_unidad: number; dias_entrega: number; marca_id?: number; comentario?: string }): Observable<ApiResponse<any>> {
        return this.post<ApiResponse<any>>(`${this.endpoint}/submit-cost`, data);
    }

    /**
     * Obtener Órdenes de Compra del proveedor
     */
    getPurchaseOrders(params: QueryParams = {}): Observable<PaginatedResponse<any>> {
        return this.get<PaginatedResponse<any>>(`${this.endpoint}/purchase-orders`, params);
    }

    /**
     * Registrar despacho de una Orden de Compra
     */
    registerDispatch(
        ocId: number,
        data: {
            guia: string;
            transportadora_id: number;
            fecha_despacho: string;
            observaciones?: string;
        }
    ): Observable<ApiResponse<any>> {
        return this.put<ApiResponse<any>>(`${this.endpoint}/purchase-orders/${ocId}/dispatch`, data);
    }
}
