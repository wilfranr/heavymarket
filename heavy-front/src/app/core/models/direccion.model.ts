/**
 * Modelo de Dirección
 */
export interface Direccion {
    id: number;
    tercero_id: number;
    direccion: string;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    principal: boolean;
    destinatario?: string | null;
    nit_cc?: string | null;
    transportadora_id?: number | null;
    forma_pago?: string | null;
    telefono?: string | null;
    ciudad_texto?: string | null;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    tercero?: any;
    country?: any;
    city?: any;
    state?: any;
    transportadora?: any;
}

/**
 * DTO para crear dirección
 */
export interface CreateDireccionDto {
    tercero_id: number;
    direccion: string;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    principal?: boolean;
    destinatario?: string | null;
    nit_cc?: string | null;
    transportadora_id?: number | null;
    forma_pago?: string | null;
    telefono?: string | null;
    ciudad_texto?: string | null;
}

/**
 * DTO para actualizar dirección
 */
export interface UpdateDireccionDto {
    tercero_id?: number;
    direccion?: string;
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
    principal?: boolean;
    destinatario?: string | null;
    nit_cc?: string | null;
    transportadora_id?: number | null;
    forma_pago?: string | null;
    telefono?: string | null;
    ciudad_texto?: string | null;
}
