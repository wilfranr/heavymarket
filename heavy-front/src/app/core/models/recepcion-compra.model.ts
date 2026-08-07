import type { OrdenCompra } from './orden-compra.model';
import type { OrdenTrabajo } from './orden-trabajo.model';

export type RecepcionCompraEstado = 'Activa' | 'Anulada';

export interface RecepcionCompra {
    id: number;
    orden_trabajo_id: number | null;
    orden_compra_id: number;
    recibido_por: number;
    fecha_recepcion: string;
    numero_remision: string | null;
    observaciones: string | null;
    estado: RecepcionCompraEstado;
    anulada_por: number | null;
    fecha_anulacion: string | null;
    motivo_anulacion: string | null;
    created_at: string;
    updated_at: string;
    orden_trabajo?: OrdenTrabajo | null;
    orden_compra?: OrdenCompra | null;
    recibido_por_usuario?: RecepcionCompraUsuario | null;
    anulada_por_usuario?: RecepcionCompraUsuario | null;
    detalles?: RecepcionCompraDetalle[];
    imagenes?: RecepcionCompraImagen[];
}

export type RecepcionCompraImagenTipo = 'guia' | 'foto';

export interface RecepcionCompraImagen {
    id: number;
    recepcion_compra_id: number;
    ruta: string;
    url?: string | null;
    nombre_original: string;
    mime: string;
    size: number;
    tipo: RecepcionCompraImagenTipo;
    creado_por: number | null;
    created_at: string;
}

export interface RecepcionCompraDetalle {
    id: number;
    recepcion_compra_id: number;
    orden_compra_detalle_id: number;
    cantidad_recibida: number;
    cantidad_conforme: number;
    cantidad_rechazada: number;
    motivo_rechazo: string | null;
    created_at: string;
    updated_at: string;
    orden_compra_detalle?: RecepcionCompraOrdenCompraDetalle | null;
}

export interface RecepcionCompraUsuario {
    id: number;
    name?: string | null;
    email?: string | null;
}

export interface RecepcionCompraOrdenCompraDetalle {
    id: number;
    orden_compra_id: number;
    referencia_id: number;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
    referencia?: {
        id: number;
        referencia?: string | null;
        descripcion?: string | null;
        codigo_heavymarket?: string | null;
    } | null;
}

export interface CreateRecepcionCompraDetalleDto {
    orden_compra_detalle_id: number;
    cantidad_recibida: number;
    cantidad_conforme: number;
    cantidad_rechazada: number;
    motivo_rechazo?: string | null;
}

export interface CreateRecepcionCompraDto {
    orden_compra_id: number;
    fecha_recepcion: string;
    numero_remision?: string | null;
    observaciones?: string | null;
    detalles: CreateRecepcionCompraDetalleDto[];
}

/**
 * Línea de detalle para registrar una recepción directamente desde la Orden
 * de Compra (POST /ordenes-compra/{id}/recepciones).
 */
export interface RecepcionDetallePayload {
    orden_compra_detalle_id: number;
    cantidad_recibida: number;
    cantidad_conforme: number;
    cantidad_rechazada: number;
    motivo_rechazo?: string | null;
}

/**
 * Payload para registrar una recepción desde la Orden de Compra. No exige
 * orden_trabajo_id: el backend infiere orden_compra_id desde la ruta.
 */
export interface RegistrarRecepcionPayload {
    fecha_recepcion: string;
    numero_remision?: string | null;
    observaciones?: string | null;
    detalles: RecepcionDetallePayload[];
}
