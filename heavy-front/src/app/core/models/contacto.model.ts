/**
 * Modelo de Contacto
 */
export interface Contacto {
    id: number;
    tercero_id: number;
    nombre: string;
    cargo?: string | null;
    telefono?: string | null;
    indicativo?: string | null;
    country_id?: number | null;
    email?: string | null;
    principal: boolean;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    tercero?: any;
    country?: any;
}

/**
 * DTO para crear contacto
 */
export interface CreateContactoDto {
    tercero_id: number;
    nombre: string;
    cargo?: string | null;
    telefono?: string | null;
    indicativo?: string | null;
    country_id?: number | null;
    email?: string | null;
    principal?: boolean;
}

/**
 * DTO para actualizar contacto
 */
export interface UpdateContactoDto {
    tercero_id?: number;
    nombre?: string;
    cargo?: string | null;
    telefono?: string | null;
    indicativo?: string | null;
    country_id?: number | null;
    email?: string | null;
    principal?: boolean;
}
