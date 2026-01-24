/**
 * Modelo de TRM (Tasa Representativa del Mercado)
 */
export interface TRM {
    id: number;
    trm: number;
    created_at: string;
    updated_at: string;
}

/**
 * DTO para crear TRM
 */
export interface CreateTRMDto {
    trm: number;
}

/**
 * DTO para actualizar TRM
 */
export interface UpdateTRMDto {
    trm?: number;
}
