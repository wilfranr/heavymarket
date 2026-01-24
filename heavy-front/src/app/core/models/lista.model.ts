/**
 * Modelo de Lista
 * 
 * Representa los catálogos del sistema (marcas, tipos de máquina, unidades de medida, etc.)
 */
export interface Lista {
  id: number;
  tipo: ListaTipo;
  nombre: string;
  definicion: string | null;
  foto: string | null;
  fotoMedida: string | null;
  sistema_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relaciones
  sistemas?: any[];
}

/**
 * Tipos de lista disponibles
 */
export type ListaTipo = 
  | 'Marca'
  | 'Tipo de Máquina'
  | 'Tipo de Artículo'
  | 'Pieza Estandar'
  | 'Unidad de Medida'
  | 'Tipo de Medida'
  | 'Nombre de Medida';

/**
 * Datos para crear una lista
 */
export interface CreateListaDto {
  tipo: ListaTipo;
  nombre: string;
  definicion?: string;
  foto?: string;
  fotoMedida?: string;
  sistema_id?: number;
}

/**
 * Datos para actualizar una lista
 */
export interface UpdateListaDto {
  tipo?: ListaTipo;
  nombre?: string;
  definicion?: string;
  foto?: string;
  fotoMedida?: string;
  sistema_id?: number;
}
