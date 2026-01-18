/**
 * Modelo de Tercero (Cliente/Proveedor)
 */
export interface Tercero {
  id: number;
  tipo_documento: TipoDocumento;
  documento: string;
  razon_social: string;
  nombre_comercial: string | null;
  tipo_tercero: TipoTercero;
  email: string | null;
  telefono: string | null;
  celular: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  es_cliente: boolean;
  es_proveedor: boolean;
  estado: EstadoTercero;
  created_at: string;
  updated_at: string;
  
  // Relaciones opcionales
  contactos?: any[];
  direcciones?: any[];
  fabricantes?: any[];
  sistemas?: any[];
}

/**
 * Tipos de documento
 */
export type TipoDocumento = 'NIT' | 'CC' | 'CE' | 'Pasaporte';

/**
 * Tipos de tercero
 */
export type TipoTercero = 'Natural' | 'Juridico';

/**
 * Estados del tercero
 */
export type EstadoTercero = 'Activo' | 'Inactivo';

/**
 * Datos para crear un tercero
 */
export interface CreateTerceroDto {
  tipo_documento: TipoDocumento;
  documento: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_tercero: TipoTercero;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  es_cliente: boolean;
  es_proveedor: boolean;
  estado?: EstadoTercero;
}

/**
 * Datos para actualizar un tercero
 */
export interface UpdateTerceroDto {
  tipo_documento?: TipoDocumento;
  documento?: string;
  razon_social?: string;
  nombre_comercial?: string;
  tipo_tercero?: TipoTercero;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  es_cliente?: boolean;
  es_proveedor?: boolean;
  estado?: EstadoTercero;
}
