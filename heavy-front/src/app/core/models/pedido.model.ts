/**
 * Modelo de Pedido
 */
export interface Pedido {
    id: number;
    user_id: number;
    tercero_id: number;
    direccion: string | null;
    comentario: any | null;
    contacto_id: number | null;
    estado: PedidoEstado;
    maquina_id: number | null;
    fabricante_id: number | null;
    motivo_rechazo: string | null;
    comentarios_rechazo: any | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    user?: {
        id: number;
        name: string;
        email: string;
    };
    tercero?: any;
    maquina?: any;
    fabricante?: any;
    contacto?: any;
    referencias?: PedidoReferencia[];
    articulos?: PedidoArticulo[];

    // Contadores
    total_referencias?: number;
    total_articulos?: number;
}

/**
 * Modelo de PedidoReferencia (relación entre Pedido y Referencia)
 */
export interface PedidoReferencia {
    id: number;
    pedido_id: number;
    referencia_id: number;
    sistema_id: number | null;
    lista_id: number | null;
    categoria_comercial_id: number | null;
    marca_id: number | null;
    definicion: string | null;
    cantidad: number;
    comentario: any | null;
    /** Número de entradas de comentario (JSON / legacy), expuesto por API (#68) */
    comentarios_count?: number;
    imagen: string | null;
    /** Filas en pedido_referencia_imagen + imagen legacy; expuesto por API (#68) */
    imagenes_count?: number;
    mostrar_referencia: boolean;
    estado: boolean;

    // Relaciones
    referencia?: {
        id?: number;
        referencia?: string;
        comentario?: string | null;
        articulo_id?: number | null;
        marca_id?: number | null;
        articulo?: {
            definicion?: string;
            descripcionEspecifica?: string;
            es_pieza_estandar?: boolean;
            peso?: number | null;
            fotoDescriptiva?: string | null;
            referencias?: any[];
            referencias_cruzadas?: any[];
        };
    };
    sistema?: any;
    lista?: { id: number; nombre: string };
    categoria_comercial?: { id: number; nombre: string };
    marca?: any;
    imagenes?: PedidoReferenciaImagen[];
    proveedores?: PedidoReferenciaProveedor[];
}

/**
 * Imagen asociada a un ítem del pedido (cliente, asesor, costeo)
 */
export interface PedidoReferenciaImagen {
    id: number;
    pedido_referencia_id: number;
    imagen: string;
    origen: 'cliente' | 'asesor' | 'costeo';
    created_at?: string;
}

/**
 * Modelo de PedidoArticulo (relación entre Pedido y Articulo)
 */
export interface PedidoArticulo {
    id: number;
    pedido_id: number;
    articulo_id: number;
    cantidad: number;
    comentario: any | null;
    sistema_id: number | null;
    imagen: string | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    articulo?: any;
    sistema?: any;
}

/**
 * Modelo de PedidoReferenciaProveedor (proveedores por referencia)
 */
export interface PedidoReferenciaProveedor {
    id: number;
    pedido_referencia_id: number;
    referencia_id: number;
    proveedor_id: number;
    marca_id: number | null;
    dias_entrega: number;
    costo_unidad: number;
    utilidad: number;
    valor_unidad: number;
    valor_total: number;
    ubicacion: 'Nacional' | 'Internacional';
    estado: boolean;
    cantidad: number;

    // Relaciones
    tercero?: any;
    marca?: any;
}

/**
 * Estados posibles del pedido
 */
/** Valores persistidos en API/BD. Etiquetas en UI: `PEDIDO_ESTADO_ETIQUETA` / `pedidoEstadoEtiqueta` en `core/utils/pedido-estado-tag`. */
export type PedidoEstado = 'Borrador' | 'Nuevo' | 'En_Analisis' | 'Enviado' | 'Entregado' | 'Cancelado' | 'Rechazado' | 'Cotizado' | 'En_Costeo' | 'Aprobado';

/**
 * Datos para crear un pedido
 */
export interface CreatePedidoDto {
    tercero_id: number;
    direccion?: string;
    comentario?: any;
    contacto_id?: number;
    estado?: PedidoEstado;
    maquina_id?: number;
    fabricante_id?: number;
    referencias?: CreatePedidoReferenciaDto[];
    articulos?: CreatePedidoArticuloDto[];
}

/**
 * Datos para crear un artículo en un pedido
 */
export interface CreatePedidoArticuloDto {
    articulo_id: number;
    cantidad: number;
    comentario?: any;
    sistema_id?: number;
    imagen?: string;
}

/**
 * Datos para actualizar un artículo de un pedido
 */
export interface UpdatePedidoArticuloDto {
    cantidad?: number;
    comentario?: any;
    sistema_id?: number;
    imagen?: string;
}

/**
 * Datos para crear una referencia en un pedido
 */
export interface CreatePedidoReferenciaDto {
    referencia_id: number;
    sistema_id?: number;
    lista_id?: number;
    categoria_comercial_id?: number;
    marca_id?: number;
    definicion?: string;
    cantidad: number;
    comentario?: any;
    imagen?: string;
    mostrar_referencia?: boolean;
    estado?: boolean;
    proveedores?: CreatePedidoReferenciaProveedorDto[];
}

/**
 * Datos para crear un proveedor para una referencia
 */
export interface CreatePedidoReferenciaProveedorDto {
    tercero_id: number;
    marca_id?: number;
    dias_entrega: number;
    costo_unidad: number;
    utilidad: number;
    cantidad: number;
    ubicacion: 'Nacional' | 'Internacional';
    estado?: boolean;
}

/**
 * Datos para actualizar un proveedor de una referencia
 */
export interface UpdatePedidoReferenciaProveedorDto {
    marca_id?: number;
    dias_entrega?: number;
    costo_unidad?: number;
    utilidad?: number;
    cantidad?: number;
    ubicacion?: 'Nacional' | 'Internacional';
    estado?: boolean;
}

/**
 * Datos para actualizar un pedido
 */
export interface UpdatePedidoDto {
    tercero_id?: number;
    direccion?: string;
    comentario?: any;
    contacto_id?: number;
    estado?: PedidoEstado;
    maquina_id?: number;
    fabricante_id?: number;
    motivo_rechazo?: string;
    comentarios_rechazo?: any;
    referencias?: any[];
}
