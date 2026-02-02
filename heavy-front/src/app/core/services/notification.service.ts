import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Notification, NotificationType, CreateNotificationDto } from '../models/notification.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio de notificaciones
 * Maneja notificaciones persistentes vía API
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/notifications`;

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private notificationsSignal = signal<Notification[]>([]);
    public notifications = this.notificationsSignal.asReadonly();

    public unreadCount = computed(() => this.notificationsSignal().filter((n) => !n.read).length);

    constructor() {
        this.loadNotifications();
        // Polling cada 60 segundos para mantener actualizado
        setInterval(() => this.loadNotifications(), 60000);
    }

    /**
     * Carga notificaciones desde la API
     */
    loadNotifications(): void {
        // La API retorna paginación { data: [...], meta: ... } o array directo dependiendo de la implementación.
        // Asumiendo paginación estándar de Laravel Resource/Paginate:
        this.http.get<any>(this.apiUrl).subscribe({
            next: (response) => {
                const notifications = response.data || response;
                if (Array.isArray(notifications)) {
                    this.notificationsSignal.set(notifications);
                    this.notificationsSubject.next(notifications);
                }
            },
            error: (err) => console.error('Error cargando notificaciones', err)
        });
    }

    /**
     * Agrega una notificación localmente (optimista) y opcionalmente la envía al backend si fuera necesario
     * (Generalmente las notificaciones se crean desde el backend, esto es para feedback inmediato)
     */
    addLocalNotification(dto: CreateNotificationDto): void {
        const newNotification: Notification = {
            id: Date.now().toString(), // Temp ID
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
        const updated = [newNotification, ...current];
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);
    }

    /**
     * Marca una notificación como leída
     */
    markAsRead(id: string | number): void {
        // Optimistic update
        const current = this.notificationsSignal();
        const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);

        this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe({
            error: () => {
                // Revert on error if needed
                console.error('Error marcando como leída');
                this.loadNotifications(); // Reload to sync
            }
        });
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    markAllAsRead(): void {
        // Optimistic update
        const current = this.notificationsSignal();
        const updated = current.map((n) => ({ ...n, read: true }));
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);

        this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe({
            error: () => {
                console.error('Error marcando todas como leídas');
                this.loadNotifications();
            }
        });
    }

    /**
     * Elimina una notificación
     */
    deleteNotification(id: string | number): void {
        // Optimistic update
        const current = this.notificationsSignal();
        const updated = current.filter((n) => n.id !== id);
        this.notificationsSignal.set(updated);
        this.notificationsSubject.next(updated);

        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            error: () => {
                console.error('Error eliminando notificación');
                this.loadNotifications();
            }
        });
    }

    /**
     * Obtiene el icono según el tipo de notificación (Fallback)
     */
    private getIconForType(type: NotificationType): string {
        const iconMap: Record<NotificationType, string> = {
            pedido_creado: 'pi-shopping-cart',
            pedido_actualizado: 'pi-refresh',
            cotizacion_nueva: 'pi-file',
            orden_confirmada: 'pi-check-circle',
            tercero_nuevo: 'pi-users',
            sistema: 'pi-info-circle',
            info: 'pi-bell'
        };
        return iconMap[type] || 'pi-bell';
    }

    /**
     * Obtiene el color según el tipo de notificación (Fallback)
     */
    private getColorForType(type: NotificationType): string {
        const colorMap: Record<NotificationType, string> = {
            pedido_creado: 'blue',
            pedido_actualizado: 'orange',
            cotizacion_nueva: 'purple',
            orden_confirmada: 'green',
            tercero_nuevo: 'cyan',
            sistema: 'gray',
            info: 'blue'
        };
        return colorMap[type] || 'blue';
    }
}
