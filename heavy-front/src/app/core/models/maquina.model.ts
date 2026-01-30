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
