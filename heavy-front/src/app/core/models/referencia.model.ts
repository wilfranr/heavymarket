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
        peso?: number | null;
        fotoDescriptiva?: string | null;
        foto_medida?: string | null;
        medidas?: any[];
        componentes_juego?: any[];
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
    pertenece_a_juegos?: any[];
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
