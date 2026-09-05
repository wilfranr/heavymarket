import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { OrdenTrabajo, OrdenTrabajoReferencia, OrdenTrabajoCompletitud, OrdenTrabajoResumenFacturacion, CreateOrdenTrabajoDto, UpdateOrdenTrabajoDto, DepurarOrdenTrabajoReferenciaDto } from '../models/orden-trabajo.model';
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
     * Detalle de cumplimiento por linea (recibida + depurada == cotizada)
     */
    getCompletitud(id: number): Observable<OrdenTrabajoCompletitud> {
        return this.get<OrdenTrabajoCompletitud>(`${this.getBaseUrl()}/${id}/completitud`);
    }

    /**
     * Depurar (marcar como faltante definitivo) una referencia de la orden
     */
    depurarReferencia(ordenTrabajoId: number, referenciaId: number, data: DepurarOrdenTrabajoReferenciaDto): Observable<{ data: OrdenTrabajoReferencia }> {
        return this.patch<{ data: OrdenTrabajoReferencia }>(`${this.getBaseUrl()}/${ordenTrabajoId}/referencias/${referenciaId}/depurar`, data);
    }

    /**
     * Resumen de lo facturable (excluye del total la cantidad depurada)
     */
    getResumenFacturacion(id: number): Observable<OrdenTrabajoResumenFacturacion> {
        return this.get<OrdenTrabajoResumenFacturacion>(`${this.getBaseUrl()}/${id}/resumen-facturacion`);
    }

    /**
     * Facturar (cerrar comercialmente) la orden de trabajo. `formData` debe
     * incluir `numero_factura` y, opcionalmente, `factura_pdf`.
     */
    facturar(id: number, formData: FormData): Observable<{ data: OrdenTrabajo }> {
        return this.post<{ data: OrdenTrabajo }>(`${this.getBaseUrl()}/${id}/facturar`, formData);
    }

    /**
     * Eliminar una orden de trabajo
     */
    deleteOrdenTrabajo(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
