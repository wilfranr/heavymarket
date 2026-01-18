/**
 * Modelo de Cotización
 */
export interface Cotizacion {
    id: number;
    user_id: number;
    tercero_id: number;
    fecha: string;
    validez: string | null;
    observaciones: string | null;
    estado: CotizacionEstado;
    total: number | null;
    created_at: string;
    updated_at: string;
    user?: any;
    tercero?: any;
}

/**
 * Estados posibles de una cotización
 */
export type CotizacionEstado = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';

/**
 * DTO para crear cotización
 */
export interface CreateCotizacionDto {
    tercero_id: number;
    fecha?: string;
    validez?: string;
    observaciones?: string;
    estado?: CotizacionEstado;
    total?: number;
}

/**
 * DTO para actualizar cotización
 */
export interface UpdateCotizacionDto {
    tercero_id?: number;
    fecha?: string;
    validez?: string;
    observaciones?: string;
    estado?: CotizacionEstado;
    total?: number;
}
