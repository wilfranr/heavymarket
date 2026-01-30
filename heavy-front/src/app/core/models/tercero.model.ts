/**
 * Modelo de Tercero (Cliente/Proveedor)
 */
export interface Tercero {
    id: number;
    nombre: string;
    tipo_documento: TipoDocumento;
    numero_documento: string;
    dv: string | null;
    tipo: TipoTercero; // Cliente, Proveedor, Ambos
    email: string | null;
    telefono: string;
    direccion: string | null;
    estado: EstadoTercero;
    created_at: string;
    updated_at: string;

    // Relaciones opcionales
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;
}

/**
 * Tipos de documento
 */
export type TipoDocumento = 'nit' | 'cc' | 'ce' | 'pasaporte';

/**
 * Tipos de tercero
 */
export type TipoTercero = 'Cliente' | 'Proveedor' | 'Ambos';

/**
 * Estados del tercero
 */
export type EstadoTercero = 'activo' | 'inactivo';

/**
 * Datos para crear un tercero
 */
export interface CreateTerceroDto {
    nombre: string;
    tipo_documento: TipoDocumento;
    numero_documento: string;
    dv?: string;
    telefono: string;
    email?: string;
    direccion?: string;
    tipo: TipoTercero;
    estado?: EstadoTercero;
    // Opcionales que no usaremos en el formulario rápido pero existen
    forma_pago?: string;
    city_id?: number;
    state_id?: number;
    country_id?: number;
}

/**
 * Datos para actualizar un tercero
 */
export interface UpdateTerceroDto {
    nombre?: string;
    tipo_documento?: TipoDocumento;
    numero_documento?: string;
    dv?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    tipo?: TipoTercero;
    estado?: EstadoTercero;
}
