/**
 * Modelo de Referencia
 * 
 * Representa las referencias o códigos de artículos en el sistema
 */
export interface Referencia {
  id: number;
  referencia: string;
  marca_id: number | null;
  comentario: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones opcionales
  marca?: {
    id: number;
    nombre: string;
    tipo: string;
  };
  articulos?: any[];
  categoria?: any;
}

/**
 * Datos para crear una referencia
 */
export interface CreateReferenciaDto {
  referencia: string;
  marca_id?: number;
  comentario?: string;
}

/**
 * Datos para actualizar una referencia
 */
export interface UpdateReferenciaDto {
  referencia?: string;
  marca_id?: number;
  comentario?: string;
}
