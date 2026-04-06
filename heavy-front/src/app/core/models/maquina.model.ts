/**
 * Valores permitidos por la API (enum MySQL + validación `in:por_revisar,revisado`).
 * @see heavy-api/database/migrations/*_add_estado_revision_to_maquinas_table.php
 */
export const ESTADOS_REVISION_MAQUINA = ['por_revisar', 'revisado'] as const;
export type EstadoRevisionMaquina = (typeof ESTADOS_REVISION_MAQUINA)[number];

export const ESTADO_REVISION_LABELS: Record<EstadoRevisionMaquina, string> = {
    por_revisar: 'Por revisar',
    revisado: 'Revisado'
};

/** Normaliza respuestas antiguas o incompletas al valor por defecto de BD. */
export function normalizeEstadoRevision(value: unknown): EstadoRevisionMaquina {
    if (value === 'por_revisar' || value === 'revisado') {
        return value;
    }
    return 'por_revisar';
}

/**
 * Modelo de Máquina
 *
 * Representa las máquinas pesadas en el sistema
 */
export interface Maquina {
    id: number;
    tipo: number; // ID de lista donde tipo='Tipo de Máquina'
    modelo: string;
    fabricante_id: number;
    serie: string | null;
    arreglo: string | null;
    foto: string | null;
    fotoId: string | null;
    estado_revision: EstadoRevisionMaquina;
    created_at: string;
    updated_at: string;

    // Relaciones opcionales
    fabricante?: {
        id: number;
        nombre: string;
    };
    tipoLista?: {
        id: number;
        nombre: string;
        tipo: string;
    };
}

/**
 * Datos para crear una máquina
 */
export interface CreateMaquinaDto {
    tipo: number;
    modelo: string;
    fabricante_id: number;
    serie?: string;
    arreglo?: string;
    foto?: string;
    fotoId?: string;
}

/**
 * Datos para actualizar una máquina
 */
export interface UpdateMaquinaDto {
    tipo?: number;
    modelo?: string;
    fabricante_id?: number;
    serie?: string;
    arreglo?: string;
    foto?: string;
    fotoId?: string;
}
