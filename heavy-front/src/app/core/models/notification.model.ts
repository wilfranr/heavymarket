/**
 * Tipos de notificación
 */
export type NotificationType =
    | 'pedido_creado'
    | 'pedido_en_analisis'
    | 'pedido_actualizado'
    | 'pedido_cotizado'
    | 'pedido_devuelto_analista'
    | 'pedido_devuelto'
    | 'cotizacion_nueva'
    | 'orden_confirmada'
    | 'tercero_nuevo'
    | 'sistema'
    | 'info'
    | 'missing_freight_rate'
    | 'freight_rate_request';

/**
 * Modelo de Notificación
 */
export interface Notification {
    id: string | number;
    type: NotificationType;
    title: string;
    message: string;
    icon: string;
    iconColor: string;
    read: boolean;
    created_at: string;
    data?: any;
}

/**
 * DTO para crear notificación
 */
export interface CreateNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
}
