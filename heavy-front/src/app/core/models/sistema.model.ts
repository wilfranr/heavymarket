import type { Lista } from './lista.model';

/**
 * Modelo de Sistema
 *
 * Representa los sistemas de maquinaria pesada (hidráulico, eléctrico, etc.)
 */
export interface Sistema {
    id: number;
    nombre: string;
    descripcion: string | null;
    imagen: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    articulos?: Lista[];
}

export interface SyncSistemaTiposArticuloDto {
    lista_ids: number[];
}

export interface SistemaSelectOption {
    label: string;
    value: number;
}

/**
 * Datos para crear un sistema
 */
export interface CreateSistemaDto {
    nombre: string;
    descripcion?: string;
    imagen?: string;
}

/**
 * Datos para actualizar un sistema
 */
export interface UpdateSistemaDto {
    nombre?: string;
    descripcion?: string;
    imagen?: string;
}
