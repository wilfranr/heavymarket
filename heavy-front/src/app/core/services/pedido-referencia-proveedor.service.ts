import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PedidoReferenciaProveedor, CreatePedidoReferenciaProveedorDto, UpdatePedidoReferenciaProveedorDto } from '../models/pedido.model';

/**
 * Servicio para gestionar proveedores de referencias de pedidos
 */
@Injectable({
    providedIn: 'root'
})
export class PedidoReferenciaProveedorService extends ApiService {
    protected override getBaseUrl(): string {
        return `${this.API_URL}/pedidos`;
    }

    /**
     * Agregar un proveedor a una referencia de pedido
     */
    addProveedor(pedidoId: number, referenciaId: number, proveedor: CreatePedidoReferenciaProveedorDto): Observable<{ data: PedidoReferenciaProveedor }> {
        return this.http.post<{ data: PedidoReferenciaProveedor }>(
            `${this.getBaseUrl()}/${pedidoId}/referencias/${referenciaId}/proveedores`,
            proveedor
        );
    }

    /**
     * Actualizar un proveedor de una referencia de pedido
     */
    updateProveedor(
        pedidoId: number,
        referenciaId: number,
        proveedorId: number,
        cambios: UpdatePedidoReferenciaProveedorDto
    ): Observable<{ data: PedidoReferenciaProveedor }> {
        return this.http.put<{ data: PedidoReferenciaProveedor }>(
            `${this.getBaseUrl()}/${pedidoId}/referencias/${referenciaId}/proveedores/${proveedorId}`,
            cambios
        );
    }

    /**
     * Eliminar un proveedor de una referencia de pedido
     */
    deleteProveedor(pedidoId: number, referenciaId: number, proveedorId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.getBaseUrl()}/${pedidoId}/referencias/${referenciaId}/proveedores/${proveedorId}`
        );
    }
}
