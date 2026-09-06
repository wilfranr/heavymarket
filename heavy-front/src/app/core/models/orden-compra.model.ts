/**
 * Modelo de Orden de Compra
 */
export interface OrdenCompra {
    id: number;
    user_id: number | null;
    tercero_id: number | null;
    pedido_id: number | null;
    cotizacion_id: number | null;
    proveedor_id: number;
    estado: OrdenCompraEstado | null;
    pedido_referencia_id: number | null;
    fecha_expedicion: string | null;
    fecha_entrega: string | null;
    fecha_envio: string | null;
    fecha_confirmacion: string | null;
    fecha_recepcion: string | null;
    fecha_despacho: string | null;
    fecha_aprobacion_gerencia?: string | null;
    fecha_pago?: string | null;
    fecha_resolucion_novedad?: string | null;
    instrucciones_despacho?: string | null;
    motivo_rechazo_gerencia?: string | null;
    aprobado_por_gerente_id?: number | null;
    comprobante_pago_ruta?: string | null;
    pagado_por_id?: number | null;
    referencia_pago?: string | null;
    motivo_reembolso?: string | null;
    resolucion_novedad_tipo?: string | null;
    resolucion_novedad_comentario?: string | null;
    resuelto_por_id?: number | null;
    observaciones: string | null;
    motivo_cancelacion: string | null;
    notas_cierre: string | null;
    cantidad: number | null;
    direccion: string | null;
    telefono: string | null;
    valor_unitario: number | null;
    valor_total: number | null;
    valor_iva: number | null;
    valor_descuento: number | null;
    guia: string | null;
    transportadora_id: number | null;
    color: OrdenCompraColor | null;
    estado_recepcion: EstadoRecepcion | null;
    created_at: string;
    updated_at: string;

    // Relaciones
    user?: OrdenCompraUsuario | null;
    aprobado_por_gerente?: OrdenCompraUsuario | null;
    pagado_por?: OrdenCompraUsuario | null;
    resuelto_por?: OrdenCompraUsuario | null;
    tercero?: OrdenCompraTercero | null;
    transportadora?: OrdenCompraTransportadora | null;
    proveedor?: OrdenCompraTercero | null;
    pedido?: OrdenCompraPedido | null;
    cotizacion?: OrdenCompraCotizacion | null;
    pedido_referencia?: OrdenCompraPedidoReferencia | null;
    detalles?: OrdenCompraReferencia[];
    referencias?: OrdenCompraReferencia[];
    archivos_despacho?: OrdenCompraDespachoArchivo[];
}

export interface OrdenCompraDespachoArchivo {
    id: number;
    orden_compra_id: number;
    ruta: string;
    nombre_original: string;
    mime?: string | null;
    size?: number | null;
    tipo: 'foto_paquete' | 'guia';
    url?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Estado de recepción computado (informativo), derivado de cantidad_recibida
 * vs cantidad. No forma parte del ciclo de vida formal (OrdenCompraEstado).
 */
export type EstadoRecepcion = 'En tránsito' | 'Recibida parcialmente' | 'Recibida';

/**
 * Estados posibles de una orden de compra (Flujo formal del cliente + retrocompatibilidad)
 */
export type OrdenCompraEstado =
    | 'Pendiente de Revisión de Stock'
    | 'Stock Incompleto'
    | 'En Espera de Aprobación Gerencial'
    | 'Devuelta por Gerencia'
    | 'Pendiente de Pago'
    | 'Pagada / Lista para Despacho'
    | 'Cancelada - Reembolso Pendiente'
    | 'En Tránsito'
    | 'Recepción con Novedades (Bloqueada)'
    | 'Entregada / Cerrada'
    | 'Generada'
    | 'Enviada'
    | 'Confirmada'
    | 'Pagada'
    | 'Despachada'
    | 'Recibida parcialmente'
    | 'Recibida'
    | 'Cancelada';

/**
 * Colores de estado de orden de compra
 */
export type OrdenCompraColor = '#FFFF00' | '#2196F3' | '#8BC34A' | '#9C27B0' | '#E91E63' | '#FF9800' | '#00ff00' | '#ff0000' | '#F44336' | '#FFC107' | '#00BCD4' | '#D32F2F';

export interface OrdenCompraUsuario {
    id: number;
    name?: string | null;
    email?: string | null;
}

export interface OrdenCompraTercero {
    id: number;
    nombre?: string | null;
    razon_social?: string | null;
    email?: string | null;
    telefono?: string | null;
}

export interface OrdenCompraTransportadora {
    id: number;
    nombre?: string | null;
}

export interface OrdenCompraPedido {
    id: number;
    estado?: string | null;
    maquina?: {
        id: number;
        nombre?: string | null;
        marca?: string | null;
        modelo?: string | null;
        serie?: string | null;
        horas?: number | null;
        tipo?: string | null;
    } | null;
    tercero?: {
        id: number;
        nombre?: string | null;
        nit?: string | null;
        telefono?: string | null;
        email?: string | null;
        city?: {
            id: number;
            name?: string | null;
        } | null;
    } | null;
    contacto?: {
        id: number;
        nombre?: string | null;
        telefono?: string | null;
        email?: string | null;
    } | null;
    user?: {
        id: number;
        name?: string | null;
    } | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface OrdenCompraCotizacion {
    id: number;
    estado?: string | null;
}

export interface OrdenCompraPedidoReferencia {
    id: number;
    referencia_id?: number | null;
    cantidad?: number | null;
}

export interface OrdenCompraReferenciaDetalle {
    id: number;
    referencia?: string | null;
    codigo_heavymarket?: string | null;
    descripcion?: string | null;
    comentario?: string | null;
    marca?: {
        id: number;
        nombre?: string | null;
    } | null;
    articulo?: {
        id: number;
        definicion?: string | null;
        descripcionEspecifica?: string | null;
    } | null;
    articulo_definicion?: string | null;
}

/**
 * Modelo de OrdenCompraReferencia (pivot)
 */
export interface OrdenCompraReferencia {
    id: number;
    orden_compra_id: number;
    referencia_id: number;
    cantidad: number;
    cantidad_original?: number | null;
    motivo_faltante?: string | null;
    cantidad_recibida: number;
    estado_item: EstadoRecepcion | null;
    saldo_pendiente: number;
    valor_unitario: number;
    valor_total: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    orden_compra?: OrdenCompra;
    referencia?: OrdenCompraReferenciaDetalle | null;
}

/**
 * DTO para crear orden de compra
 */
export interface CreateOrdenCompraDto {
    proveedor_id: number;
    pedido_id?: number;
    cotizacion_id?: number;
    tercero_id?: number;
    fecha_expedicion: string;
    fecha_entrega: string;
    estado?: OrdenCompraEstado;
    color?: OrdenCompraColor;
    observaciones?: string;
    direccion?: string;
    telefono?: string;
    guia?: string;
    motivo_cancelacion?: string;
    notas_cierre?: string;
    referencias?: CreateOrdenCompraReferenciaDto[];
}

/**
 * DTO para crear referencia en orden de compra
 */
export interface CreateOrdenCompraReferenciaDto {
    referencia_id: number;
    cantidad: number;
    valor_unitario: number;
    valor_total: number;
}

/**
 * DTO para actualizar orden de compra
 */
export interface UpdateOrdenCompraDto {
    estado?: OrdenCompraEstado;
    color?: OrdenCompraColor;
    fecha_expedicion?: string;
    fecha_entrega?: string;
    fecha_envio?: string;
    fecha_confirmacion?: string;
    fecha_recepcion?: string;
    observaciones?: string;
    motivo_cancelacion?: string;
    notas_cierre?: string;
    direccion?: string;
    telefono?: string;
    guia?: string;
    referencias?: CreateOrdenCompraReferenciaDto[];
}

export interface TransitionOrdenCompraDto {
    estado_destino: OrdenCompraEstado;
    instrucciones_despacho?: string;
    motivo_rechazo_gerencia?: string;
    referencia_pago?: string;
    comprobante_pago_ruta?: string;
    motivo_reembolso?: string;
    resolucion_novedad_tipo?: 'reposicion' | 'nota_credito';
    resolucion_novedad_comentario?: string;
    motivo_cancelacion?: string;
    notas_cierre?: string;
    aprobacion_admin?: boolean;
    observaciones?: string;
}

export interface ReceiveOrdenCompraReferenciaDto {
    referencia_id: number;
    cantidad_recibida: number;
}

export interface ReceiveOrdenCompraDto {
    referencias: ReceiveOrdenCompraReferenciaDto[];
    notas_cierre?: string;
    observaciones?: string;
}

export interface ConfirmPurchaseOrderItemDto {
    referencia_id: number;
    cantidad_disponible: number;
    motivo_faltante?: string;
}

export interface ConfirmPurchaseOrderDto {
    observaciones?: string;
    items?: ConfirmPurchaseOrderItemDto[];
}
