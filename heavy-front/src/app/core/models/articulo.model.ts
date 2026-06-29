import { Referencia } from './referencia.model';

/**
 * Modelo de Artículo
 *
 * Representa los artículos o piezas estándar en el sistema
 */
export interface Articulo {
    id: number;
    definicion: string; // Tipo de artículo (debe ser de tipo 'Piezas Estandar' en listas)
    descripcionEspecifica: string;
    peso: number | null;
    comentarios: string | null;
    fotoDescriptiva: string | null;
    foto_medida: string | null;
    created_at: string;
    updated_at: string;

    // Relaciones opcionales
    referencias?: Referencia[];
    medidas?: Medida[];
    articuloJuegos?: ArticuloJuego[];
}

/**
 * Modelo de Medida de Artículo
 */
export interface Medida {
    id: number;
    articulo_id: number;
    identificador: string;
    unidad: string;
    valor: number;
    tipo: string;
    imagen?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Modelo de Componente de Juego (Kit)
 */
export interface ArticuloJuego {
    id: number;
    articulo_id: number;
    referencia_id: number;
    cantidad: number;
    comentario?: string;
    referencia?: Referencia;
    created_at?: string;
    updated_at?: string;
}

/**
 * Datos para crear un artículo
 */
export interface CreateArticuloDto {
    definicion: string;
    descripcionEspecifica: string;
    peso?: number;
    comentarios?: string;
    fotoDescriptiva?: File | string;
    foto_medida?: File | string;
    referencias_ids?: number[];
}

/**
 * Datos para actualizar un artículo
 */
export interface UpdateArticuloDto {
    definicion?: string;
    descripcionEspecifica?: string;
    peso?: number;
    comentarios?: string;
    fotoDescriptiva?: File | string;
    foto_medida?: File | string;
    referencias_ids?: number[];
}
