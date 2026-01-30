/**
 * Modelo de Orden de Trabajo
 */
export interface OrdenTrabajo {
    id: number;
    user_id: number | null;
    tercero_id: number | null;
    pedido_id: number | null;
    cotizacion_id: number | null;
    estado: OrdenTrabajoEstado | null;
    fecha_ingreso: string | null;
    fecha_entrega: string | null;
    direccion_id: number | null;
    telefono: string | null;
    observaciones: string | null;
    guia: string | null;
    transportadora_id: number | null;
    archivo: string | null;
    motivo_cancelacion: string | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    user?: any;
    tercero?: any;
    pedido?: any;
    cotizacion?: any;
    transportadora?: any;
    direccion?: any;
    referencias?: OrdenTrabajoReferencia[];
}

/**
 * Estados posibles de una orden de trabajo
 */
export type OrdenTrabajoEstado = 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado';

/**
 * Modelo de OrdenTrabajoReferencia
 */
export interface OrdenTrabajoReferencia {
    id: number;
    orden_trabajo_id: number;
    pedido_referencia_id: number;
    cantidad: number;
    cantidad_recibida: number | null;
    estado: string | null;
    recibido: boolean;
    fecha_recepcion: string | null;
    observaciones: string | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    orden_trabajo?: OrdenTrabajo;
    pedido_referencia?: any;
    referencia?: any;
}

/**
 * DTO para crear orden de trabajo
 */
export interface CreateOrdenTrabajoDto {
    tercero_id?: number;
    pedido_id?: number;
    cotizacion_id?: number;
    estado?: OrdenTrabajoEstado;
    fecha_ingreso: string;
    fecha_entrega?: string;
    direccion_id?: number;
    telefono: string;
    observaciones?: string;
    guia?: string;
    transportadora_id?: number;
    archivo?: string;
    motivo_cancelacion?: string;
}

/**
 * DTO para actualizar orden de trabajo
 */
export interface UpdateOrdenTrabajoDto {
    estado?: OrdenTrabajoEstado;
    fecha_ingreso?: string;
    fecha_entrega?: string;
    direccion_id?: number;
    telefono?: string;
    observaciones?: string;
    guia?: string;
    transportadora_id?: number;
    archivo?: string;
    motivo_cancelacion?: string;
}
