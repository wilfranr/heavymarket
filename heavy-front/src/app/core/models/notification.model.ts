/**
 * Tipos de notificación
 */
export type NotificationType = 'pedido_creado' | 'pedido_actualizado' | 'cotizacion_nueva' | 'orden_confirmada' | 'tercero_nuevo' | 'sistema' | 'info';

/**
 * Modelo de Notificación
 */
export interface Notification {
    id: number;
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
