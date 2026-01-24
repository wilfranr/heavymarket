/**
 * Modelo de Empresa
 */
export interface Empresa {
    id: number;
    nombre: string;
    siglas: string | null;
    direccion: string;
    telefono: string | null;
    celular: string;
    email: string;
    nit: string;
    representante: string;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    estado: boolean;
    flete: number | null;
    trm: number | null;
    logo_light: string | null;
    logo_dark: string | null;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    country?: any;
    state?: any;
    city?: any;
}

/**
 * DTO para crear empresa
 */
export interface CreateEmpresaDto {
    nombre: string;
    siglas?: string;
    direccion: string;
    telefono?: string;
    celular: string;
    email: string;
    nit: string;
    representante: string;
    country_id?: number;
    state_id?: number;
    city_id?: number;
    estado?: boolean;
    flete?: number;
    trm?: number;
    logo_light?: string;
    logo_dark?: string;
}

/**
 * DTO para actualizar empresa
 */
export interface UpdateEmpresaDto {
    nombre?: string;
    siglas?: string;
    direccion?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    nit?: string;
    representante?: string;
    country_id?: number;
    state_id?: number;
    city_id?: number;
    estado?: boolean;
    flete?: number;
    trm?: number;
    logo_light?: string;
    logo_dark?: string;
}
