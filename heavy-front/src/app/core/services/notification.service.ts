import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Notification, NotificationType, CreateNotificationDto } from '../models/notification.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { ToastService } from './toast.service';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/**
 * Servicio de notificaciones
 * Maneja notificaciones persistentes vía API y tiempo real vía WebSockets (Reverb)
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private apiUrl = `${environment.apiUrl}/notifications`;
    private echo: Echo<any> | null = null;

    private notificationsSignal = signal<Notification[]>([]);
    public notifications = this.notificationsSignal.asReadonly();

    public unreadCount = computed(() => this.notificationsSignal().filter((n) => !n.read).length);

    constructor() {
        this.loadNotifications();
        
        // Inicializar Echo solo si está habilitado en entorno
        if (environment.pusherEnabled) {
            this.initEchoIfEnabled();
        }
    }

    /**
     * Inicializa el efecto para Echo solo si está habilitado
     */
    private initEchoIfEnabled(): void {
        effect(() => {
            const user = this.authService.currentUser();
            if (user && !this.echo) {
                this.initializeEcho(user.id);
            } else if (!user && this.echo) {
                this.echo.disconnect();
                this.echo = null;
            }
        });
    }

    /**
     * Inicializa Laravel Echo para escuchar notificaciones en tiempo real
     */
    private initializeEcho(userId: number | string): void {
        try {
            (window as any).Pusher = Pusher;

            this.echo = new Echo({
                broadcaster: 'reverb',
                key: environment.reverbKey,
                wsHost: environment.reverbHost,
                wsPort: environment.reverbPort,
                wssPort: environment.reverbPort,
                forceTLS: environment.reverbScheme === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${environment.apiBaseUrl}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${this.authService.getToken()}`
                    }
                }
            });

            this.echo.private(`App.Models.User.${userId}`)
                .notification((notification: any) => {
                    this.handleIncomingNotification(notification);
                });

            console.log(`[NotificationService] Echo initialized for user ${userId}`);
        } catch (error) {
            console.error('[NotificationService] Error initializing Echo:', error);
        }
    }

    /**
     * Maneja una notificación recibida por WebSocket
     */
    private handleIncomingNotification(notification: any): void {
        const newNotification: Notification = {
            id: notification.id,
            type: notification.type as NotificationType,
            title: notification.title,
            message: notification.message,
            icon: notification.icon || this.getIconForType(notification.type),
            iconColor: notification.iconColor || this.getColorForType(notification.type),
            read: false,
            created_at: notification.created_at || new Date().toISOString(),
            data: notification.data
        };

        // Actualizar signal
        const current = this.notificationsSignal();
        this.notificationsSignal.set([newNotification, ...current]);
        
        // Mostrar aviso visual (Toast)
        this.toastService.info(newNotification.message, newNotification.title, newNotification);
    }

    /**
     * Carga notificaciones desde la API
     */
    loadNotifications(): void {
        this.http.get<any>(this.apiUrl).subscribe({
            next: (response) => {
                const notifications = response.data || response;
                if (Array.isArray(notifications)) {
                    this.notificationsSignal.set(notifications);
                }
            },
            error: (err) => console.error('Error cargando notificaciones', err)
        });
    }

    /**
     * Agrega una notificación localmente (optimista)
     */
    addLocalNotification(dto: CreateNotificationDto): void {
        const newNotification: Notification = {
            id: Date.now().toString(),
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
    }

    /**
     * Marca una notificación como leída
     */
    markAsRead(id: string | number): void {
        const current = this.notificationsSignal();
        const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
        this.notificationsSignal.set(updated);

        this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe({
            error: () => this.loadNotifications()
        });
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    markAllAsRead(): void {
        const current = this.notificationsSignal();
        const updated = current.map((n) => ({ ...n, read: true }));
        this.notificationsSignal.set(updated);

        this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe({
            error: () => this.loadNotifications()
        });
    }

    /**
     * Elimina una notificación
     */
    deleteNotification(id: string | number): void {
        const current = this.notificationsSignal();
        const updated = current.filter((n) => n.id !== id);
        this.notificationsSignal.set(updated);

        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            error: () => this.loadNotifications()
        });
    }

    /**
     * Obtiene el icono según el tipo de notificación
     */
    private getIconForType(type: NotificationType): string {
        const iconMap: Record<NotificationType, string> = {
            pedido_creado: 'pi-shopping-cart',
            pedido_en_analisis: 'pi-search',
            pedido_actualizado: 'pi-refresh',
            pedido_cotizado: 'pi-file-pdf',
            pedido_devuelto_analista: 'pi-replay',
            pedido_devuelto: 'pi-exclamation-triangle',
            cotizacion_nueva: 'pi-file',
            orden_confirmada: 'pi-check-circle',
            tercero_nuevo: 'pi-users',
            sistema: 'pi-info-circle',
            info: 'pi-bell'
        };
        return iconMap[type] || 'pi-bell';
    }

    /**
     * Obtiene el color según el tipo de notificación
     */
    private getColorForType(type: NotificationType): string {
        const colorMap: Record<NotificationType, string> = {
            pedido_creado: 'blue',
            pedido_en_analisis: 'orange',
            pedido_actualizado: 'cyan',
            pedido_cotizado: 'green',
            pedido_devuelto_analista: 'purple',
            pedido_devuelto: 'red',
            cotizacion_nueva: 'purple',
            orden_confirmada: 'green',
            tercero_nuevo: 'cyan',
            sistema: 'gray',
            info: 'blue'
        };
        return colorMap[type] || 'blue';
    }
}
