/**
 * Modelo de Categoría
 */
export interface Categoria {
    id: number;
    nombre: string;
    created_at: string;
    updated_at: string;

    // Relaciones
    terceros?: any[];
    referencias?: any[];
}

/**
 * DTO para crear categoría
 */
export interface CreateCategoriaDto {
    nombre: string;
    terceros?: number[];
}

/**
 * DTO para actualizar categoría
 */
export interface UpdateCategoriaDto {
    nombre?: string;
    terceros?: number[];
}
