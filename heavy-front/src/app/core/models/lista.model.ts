import type { Sistema } from './sistema.model';

/**
 * Modelo de Lista
 *
 * Representa los catálogos del sistema (marcas, tipos de máquina, unidades de medida, etc.)
 */
export interface Lista {
    id: number;
    tipo: ListaTipo;
    nombre: string;
    definicion: string | null;
    foto: string | null;
    fotoMedida: string | null;
    sistema_id: number | null;
    sistema_ids?: number[];
    parent_id: number | null;
    fabricante_id: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relaciones
    sistemas?: Sistema[];
    fabricante?: ListaFabricanteResumen | null;
}

/** Registro maestro (tabla fabricantes) cuando la lista es tipo Fabricantes */
export interface ListaFabricanteResumen {
    id: number;
    nombre: string;
    descripcion: string | null;
    logo: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Tipos de lista disponibles
 */
export type ListaTipo = 'Marca' | 'Fabricantes' | 'Tipo de Máquina' | 'Tipo de Artículo' | 'Piezas Estandar' | 'Unidad de Medida' | 'Tipo de Medida' | 'Nombre de Medida' | 'Categoría Comercial';

/**
 * Datos para crear una lista
 */
export interface CreateListaDto {
    tipo: ListaTipo;
    nombre: string;
    definicion?: string;
    foto?: string;
    fotoMedida?: string;
    sistema_id?: number;
    sistema_ids?: number[];
    parent_id?: number;
}

/**
 * Datos para actualizar una lista
 */
export interface UpdateListaDto {
    tipo?: ListaTipo;
    nombre?: string;
    definicion?: string;
    foto?: string;
    fotoMedida?: string;
    sistema_id?: number;
    sistema_ids?: number[];
    parent_id?: number;
}
