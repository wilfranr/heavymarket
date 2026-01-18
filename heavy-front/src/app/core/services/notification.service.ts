import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Notification, NotificationType, CreateNotificationDto } from '../models/notification.model';

/**
 * Servicio de notificaciones
 * Maneja notificaciones en tiempo real y persistentes
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    
    private notificationsSignal = signal<Notification[]>([]);
    public notifications = this.notificationsSignal.asReadonly();
    
    public unreadCount = computed(() => 
        this.notificationsSignal().filter(n => !n.read).length
    );

    constructor() {
        this.loadMockNotifications();
    }

    /**
     * Carga notificaciones de ejemplo (mock)
     * En producción, esto vendría de la API
     */
    private loadMockNotifications(): void {
        const mockNotifications: Notification[] = [
            {
                id: 1,
                type: 'pedido_creado',
                title: 'Nuevo Pedido',
                message: 'Se ha creado un nuevo pedido #1234',
                icon: 'pi-shopping-cart',
                iconColor: 'blue',
                read: false,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                type: 'cotizacion_nueva',
                title: 'Nueva Cotización',
                message: 'Cliente ABC SAS solicitó una cotización',
                icon: 'pi-file',
                iconColor: 'orange',
                read: false,
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 3,
                type: 'tercero_nuevo',
                title: 'Nuevo Cliente',
                message: '5 nuevos clientes registrados esta semana',
                icon: 'pi-users',
                iconColor: 'green',
                read: true,
                created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 4,
                type: 'orden_confirmada',
                title: 'Orden Confirmada',
                message: 'Orden de compra #789 confirmada por el proveedor',
                icon: 'pi-check-circle',
                iconColor: 'cyan',
                read: true,
                created_at: new Date(Date.now() - 172800000).toISOString()
            }
        ];

        this.notificationsSignal.set(mockNotifications);
        this.notificationsSubject.next(mockNotifications);
    }

    /**
     * Agrega una nueva notificación
     */
    addNotification(dto: CreateNotificationDto): void {
        const newNotification: Notification = {
            id: Date.now(),
            type: dto.type,
            title: dto.title,
            message: dto.message,
            icon: this.getIconForType(dto.type),
            iconColor: this.getColorForType(dto.type),
            read: false,
            created_at: new Date().toISOString(),
            data: dto.data
        };

        const current = this.notificationsSignal();
        this.notificationsSignal.set([newNotification, ...current]);
        this.notificationsSubject.next([newNotification, ...current]);
    }

    /**
     * Marca una notificación como leída
     */
    markAsRead(id: number): void {
        const current = this.notificationsSignal();
        const updated = current.map(n => 
            n.id === id ? { ...n, read: true } : n
        );
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    markAllAsRead(): void {
        const current = this.notificationsSignal();
        const updated = current.map(n => ({ ...n, read: true }));
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);
    }

    /**
     * Elimina una notificación
     */
    deleteNotification(id: number): void {
        const current = this.notificationsSignal();
        const updated = current.filter(n => n.id !== id);
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);
    }

    /**
     * Obtiene el icono según el tipo de notificación
     */
    private getIconForType(type: NotificationType): string {
        const iconMap: Record<NotificationType, string> = {
            'pedido_creado': 'pi-shopping-cart',
            'pedido_actualizado': 'pi-refresh',
            'cotizacion_nueva': 'pi-file',
            'orden_confirmada': 'pi-check-circle',
            'tercero_nuevo': 'pi-users',
            'sistema': 'pi-info-circle',
            'info': 'pi-bell'
        };
        return iconMap[type] || 'pi-bell';
    }

    /**
     * Obtiene el color según el tipo de notificación
     */
    private getColorForType(type: NotificationType): string {
        const colorMap: Record<NotificationType, string> = {
            'pedido_creado': 'blue',
            'pedido_actualizado': 'orange',
            'cotizacion_nueva': 'purple',
            'orden_confirmada': 'green',
            'tercero_nuevo': 'cyan',
            'sistema': 'gray',
            'info': 'blue'
        };
        return colorMap[type] || 'blue';
    }
}
