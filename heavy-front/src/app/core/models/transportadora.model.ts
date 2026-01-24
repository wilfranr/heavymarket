/**
 * Modelo de Transportadora
 */
export interface Transportadora {
    id: number;
    nombre: string;
    nit?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    email?: string | null;
    contacto?: string | null;
    celular?: string | null;
    observaciones?: string | null;
    logo?: string | null;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    city?: any;
    state?: any;
    country?: any;
}

/**
 * DTO para crear transportadora
 */
export interface CreateTransportadoraDto {
    nombre: string;
    nit?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    email?: string | null;
    contacto?: string | null;
    celular?: string | null;
    observaciones?: string | null;
    logo?: string | null;
}

/**
 * DTO para actualizar transportadora
 */
export interface UpdateTransportadoraDto {
    nombre?: string;
    nit?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    email?: string | null;
    contacto?: string | null;
    celular?: string | null;
    observaciones?: string | null;
    logo?: string | null;
}
