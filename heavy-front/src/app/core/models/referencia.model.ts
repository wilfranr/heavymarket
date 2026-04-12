/**
 * Modelo de Referencia
 *
 * Representa las referencias o códigos de artículos en el sistema
 */
export interface Referencia {
    id: number;
    referencia: string;
    articulo_id: number | null;
    marca_id: number | null;
    es_temporal?: boolean;
    comentario: string | null;
    created_at: string;
    updated_at: string;

    // Relaciones opcionales
    articulo?: {
        id?: number;
        definicion?: string;
        descripcionEspecifica?: string;
        nombre?: string;
        es_pieza_estandar?: boolean;
    };
    articulo_es_pieza_estandar?: boolean;
    articulo_definicion?: string | null;
    articulo_descripcion_especifica?: string | null;
    marca?: {
        id: number;
        nombre: string;
        tipo: string;
    };
    articulos?: any[];
}

/**
 * Datos para crear una referencia
 */
export interface CreateReferenciaDto {
    referencia: string;
    articulo_id?: number | null;
    marca_id?: number | null;
    es_temporal?: boolean;
    comentario?: string | null;
}

/**
 * Datos para actualizar una referencia
 */
export interface UpdateReferenciaDto {
    referencia?: string;
    articulo_id?: number | null;
    marca_id?: number | null;
    es_temporal?: boolean;
    comentario?: string | null;
}
