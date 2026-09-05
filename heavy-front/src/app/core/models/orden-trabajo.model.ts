import type { RecepcionCompra } from './recepcion-compra.model';

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
    numero_factura: string | null;
    factura_pdf: string | null;
    facturado_por: number | null;
    facturado_at: string | null;
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
    recepciones_compra?: RecepcionCompra[];
    progreso?: OrdenTrabajoProgreso;
    facturado_por_usuario?: any;
}

/**
 * Progreso agregado de recepcion de la OT, calculado por el backend
 * (OrdenTrabajoLifecycleService::calcularProgreso).
 */
export interface OrdenTrabajoProgreso {
    cotizado: number;
    recibido: number;
    porcentaje: number;
}

/**
 * Detalle de cierre tecnico por linea (GET .../completitud)
 */
export interface OrdenTrabajoCompletitudLinea {
    referencia_id: number;
    cotizada: number;
    recibida: number;
    depurada: number;
    cumple: boolean;
}

export interface OrdenTrabajoCompletitud {
    completa: boolean;
    lineas: OrdenTrabajoCompletitudLinea[];
}

/**
 * Estados posibles de una orden de trabajo
 */
export type OrdenTrabajoEstado = 'Pendiente' | 'En Proceso' | 'Lista para Facturar' | 'Completado' | 'Cerrada' | 'Cancelado';

/**
 * Modelo de OrdenTrabajoReferencia
 */
export interface OrdenTrabajoReferencia {
    id: number;
    orden_trabajo_id: number;
    pedido_referencia_id: number;
    cantidad_cotizada: number;
    cantidad_recibida: number | null;
    cantidad_depurada: number;
    motivo_depuracion: string | null;
    depurado_por: number | null;
    depurado_at: string | null;
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
    depurado_por_usuario?: any;
}

/**
 * DTO para depurar (marcar como faltante definitivo) una referencia de la OT
 */
export interface DepurarOrdenTrabajoReferenciaDto {
    cantidad_depurada: number;
    motivo_depuracion: string;
}

/**
 * Resumen de lo facturable (GET .../resumen-facturacion). El total ya
 * excluye lo depurado (no se cobra al cliente lo que no llego).
 */
export interface OrdenTrabajoResumenFacturacionLinea {
    referencia_id: number;
    referencia: string | null;
    cantidad_cotizada: number;
    cantidad_depurada: number;
    cantidad_facturable: number;
    precio_unitario: number;
    subtotal: number;
}

export interface OrdenTrabajoResumenFacturacion {
    lineas: OrdenTrabajoResumenFacturacionLinea[];
    total: number;
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
