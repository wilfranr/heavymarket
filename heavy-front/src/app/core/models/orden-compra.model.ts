/**
 * Modelo de Orden de Compra
 */
export interface OrdenCompra {
    id: number;
    user_id: number | null;
    tercero_id: number | null;
    pedido_id: number | null;
    cotizacion_id: number | null;
    proveedor_id: number;
    estado: OrdenCompraEstado | null;
    pedido_referencia_id: number | null;
    fecha_expedicion: string | null;
    fecha_entrega: string | null;
    observaciones: string | null;
    cantidad: number | null;
    direccion: string | null;
    telefono: string | null;
    valor_unitario: number | null;
    valor_total: number | null;
    valor_iva: number | null;
    valor_descuento: number | null;
    guia: string | null;
    color: OrdenCompraColor | null;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    user?: any;
    tercero?: any;
    proveedor?: any;
    pedido?: any;
    cotizacion?: any;
    pedido_referencia?: any;
    referencias?: OrdenCompraReferencia[];
}

/**
 * Estados posibles de una orden de compra
 */
export type OrdenCompraEstado = 
    | 'Pendiente'
    | 'En proceso'
    | 'Entregado'
    | 'Cancelado';

/**
 * Colores de estado de orden de compra
 */
export type OrdenCompraColor = '#FFFF00' | '#00ff00' | '#ff0000'; // Amarillo, Verde, Rojo

/**
 * Modelo de OrdenCompraReferencia (pivot)
 */
export interface OrdenCompraReferencia {
    id: number;
    orden_compra_id: number;
    referencia_id: number;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    orden_compra?: OrdenCompra;
    referencia?: any;
}

/**
 * DTO para crear orden de compra
 */
export interface CreateOrdenCompraDto {
    proveedor_id: number;
    pedido_id?: number;
    cotizacion_id?: number;
    tercero_id?: number;
    fecha_expedicion: string;
    fecha_entrega: string;
    estado?: OrdenCompraEstado;
    color?: OrdenCompraColor;
    observaciones?: string;
    direccion?: string;
    telefono?: string;
    guia?: string;
    referencias?: CreateOrdenCompraReferenciaDto[];
}

/**
 * DTO para crear referencia en orden de compra
 */
export interface CreateOrdenCompraReferenciaDto {
    referencia_id: number;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
}

/**
 * DTO para actualizar orden de compra
 */
export interface UpdateOrdenCompraDto {
    estado?: OrdenCompraEstado;
    color?: OrdenCompraColor;
    fecha_expedicion?: string;
    fecha_entrega?: string;
    observaciones?: string;
    direccion?: string;
    telefono?: string;
    guia?: string;
}
