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

    // Campos adicionales
    forma_pago?: string | null;
    email_factura_electronica?: string | null;
    sitio_web?: string | null;

    // Acceso Landing
    landing_access?: boolean;

    // Documentos
    rut?: string | null;
    certificacion_bancaria?: string | null;
    camara_comercio?: string | null;
    cedula_representante_legal?: string | null;

    // Relaciones opcionales
    city_id?: number | null;
    state_id?: number | null;
    country_id?: number | null;

    // Relaciones cargadas
    city?: { id: number; name: string } | null;
    state?: { id: number; name: string } | null;
    country?: { id: number; name: string; iso2?: string } | null;
    contactos?: Contacto[];
    maquinas?: { id: number; modelo: string; serie?: string }[];
    fabricantes?: { id: number; nombre: string }[];
    sistemas?: { id: number; nombre: string }[];
    categorias_comerciales?: { id: number; nombre: string }[];
    categoria_comercial_ids?: number[];
    fabricante_ids?: number[];
}

/**
 * Modelo de Contacto asociado a un Tercero
 */
export interface Contacto {
    id?: number;
    tercero_id?: number;
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
    principal: boolean;
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
    landing_access?: boolean;
    landing_password?: string;
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
