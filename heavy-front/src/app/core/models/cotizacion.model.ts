/**
 * Modelo de Cotización
 */
export interface Cotizacion {
    id: number;
    user_id: number;
    tercero_id: number;
    pedido_id: number;
    estado: CotizacionEstado;
    fecha_emision: string | null;
    fecha_vencimiento: string | null;
    observaciones: string | null;
    total: number | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    user?: any;
    tercero?: any;
    pedido?: any;
    referencias_proveedores?: CotizacionReferenciaProveedor[];
}

/**
 * Estados posibles de una cotización
 */
export type CotizacionEstado = 'Pendiente' | 'Enviada' | 'Aprobada' | 'Rechazada' | 'Vencida' | 'En_Proceso' | 'Borrador' | 'Anulada' | 'No_Seleccionada';

/**
 * Modelo de CotizacionReferenciaProveedor
 */
export interface CotizacionReferenciaProveedor {
    id: number;
    cotizacion_id: number;
    pedido_referencia_proveedor_id: number;
    mostrar_referencia: boolean;
    snapshot_referencia: string | null;
    snapshot_descripcion: string | null;
    snapshot_marca_id: number | null;
    snapshot_marca: string | null;
    snapshot_proveedor_id: number | null;
    snapshot_proveedor_nombre: string | null;
    snapshot_entrega: string | null;
    snapshot_cantidad: number | null;
    snapshot_valor_unidad: string | number | null;
    snapshot_valor_total: string | number | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    cotizacion?: Cotizacion;
    pedido_referencia_proveedor?: any;
}

/**
 * DTO para crear cotización
 */
export interface CreateCotizacionDto {
    pedido_id: number;
    tercero_id: number;
    estado?: CotizacionEstado;
    fecha_vencimiento?: string;
    observaciones?: string;
}

/**
 * DTO para actualizar cotización
 */
export interface UpdateCotizacionDto {
    estado?: CotizacionEstado;
    fecha_vencimiento?: string;
    observaciones?: string;
}
