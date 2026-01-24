/**
 * Modelo de Artículo
 * 
 * Representa los artículos o piezas estándar en el sistema
 */
export interface Articulo {
  id: number;
  definicion: string; // Tipo de artículo (debe ser de tipo 'Pieza Estandar' en listas)
  descripcionEspecifica: string;
  peso: number | null;
  comentarios: string | null;
  fotoDescriptiva: string | null;
  foto_medida: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones opcionales
  referencias?: any[];
  medidas?: any[];
}

/**
 * Datos para crear un artículo
 */
export interface CreateArticuloDto {
  definicion: string;
  descripcionEspecifica: string;
  peso?: number;
  comentarios?: string;
  fotoDescriptiva?: string;
  foto_medida?: string;
}

/**
 * Datos para actualizar un artículo
 */
export interface UpdateArticuloDto {
  definicion?: string;
  descripcionEspecifica?: string;
  peso?: number;
  comentarios?: string;
  fotoDescriptiva?: string;
  foto_medida?: string;
}
