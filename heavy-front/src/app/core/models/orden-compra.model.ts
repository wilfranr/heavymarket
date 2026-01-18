/**
 * Modelo de Orden de Compra
 */
export interface OrdenCompra {
    id: number;
    user_id: number;
    proveedor_id: number;
    fecha_orden: string;
    fecha_entrega: string | null;
    estado: OrdenEstado;
    total: number | null;
    observaciones: string | null;
    created_at: string;
    updated_at: string;
    user?: any;
    proveedor?: any;
}

/**
 * Estados posibles de una orden
 */
export type OrdenEstado = 'borrador' | 'enviada' | 'confirmada' | 'recibida' | 'cancelada';

/**
 * DTO para crear orden
 */
export interface CreateOrdenCompraDto {
    proveedor_id: number;
    fecha_orden?: string;
    fecha_entrega?: string;
    estado?: OrdenEstado;
    total?: number;
    observaciones?: string;
}

/**
 * DTO para actualizar orden
 */
export interface UpdateOrdenCompraDto {
    proveedor_id?: number;
    fecha_orden?: string;
    fecha_entrega?: string;
    estado?: OrdenEstado;
    total?: number;
    observaciones?: string;
}
