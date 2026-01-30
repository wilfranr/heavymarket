/**
 * Modelo de Fabricante
 *
 * Representa los fabricantes de maquinaria pesada en el sistema
 */
export interface Fabricante {
    id: number;
    nombre: string;
    descripcion: string;
    logo: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Datos para crear un fabricante
 */
export interface CreateFabricanteDto {
    nombre: string;
    descripcion: string;
    logo?: string;
}

/**
 * Datos para actualizar un fabricante
 */
export interface UpdateFabricanteDto {
    nombre?: string;
    descripcion?: string;
    logo?: string;
}
