import { Injectable, signal, inject, effect } from '@angular/core';
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
    private unreadCountSignal = signal(0);
    private notificationsLoaded = false;
    private unreadCountLoaded = false;

    public notifications = this.notificationsSignal.asReadonly();
    public unreadCount = this.unreadCountSignal.asReadonly();

    constructor() {
        effect(() => {
            const user = this.authService.currentUser();
            if (user) {
                if (!this.unreadCountLoaded) {
                    this.unreadCountLoaded = true;
                    this.loadUnreadCount();
                }
            } else {
                this.notificationsSignal.set([]);
                this.unreadCountSignal.set(0);
                this.notificationsLoaded = false;
                this.unreadCountLoaded = false;
            }
        });

        if (environment.pusherEnabled) {
            this.initEchoIfEnabled();
        }
    }

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

            this.echo.private(`App.Models.User.${userId}`).notification((notification: any) => {
                this.handleIncomingNotification(notification);
            });

            console.log(`[NotificationService] Echo initialized for user ${userId}`);
        } catch (error) {
            console.error('[NotificationService] Error initializing Echo:', error);
        }
    }

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

        const current = this.notificationsSignal();
        this.notificationsSignal.set([newNotification, ...current]);
        this.unreadCountSignal.update((count) => count + 1);

        this.toastService.info(newNotification.message, newNotification.title, newNotification);
    }

    /**
     * Carga solo el contador de no leídas (ligero, para el badge del topbar).
     */
    loadUnreadCount(): void {
        this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
            next: (response) => this.unreadCountSignal.set(response.count ?? 0),
            error: (err) => console.error('Error cargando contador de notificaciones', err)
        });
    }

    /**
     * Carga el listado completo solo cuando el usuario abre el panel o el widget del dashboard.
     */
    ensureNotificationsLoaded(): void {
        if (this.notificationsLoaded) {
            return;
        }
        this.loadNotifications();
    }

    loadNotifications(): void {
        this.http.get<any>(this.apiUrl).subscribe({
            next: (response) => {
                const notifications = this.extractNotifications(response);
                if (notifications) {
                    this.notificationsSignal.set(notifications);
                    this.notificationsLoaded = true;
                    this.unreadCountSignal.set(notifications.filter((n) => !n.read).length);
                }
            },
            error: (err) => console.error('Error cargando notificaciones', err)
        });
    }

    private extractNotifications(response: unknown): Notification[] | null {
        if (Array.isArray(response)) {
            return response as Notification[];
        }
        if (response && typeof response === 'object' && 'data' in response) {
            const data = (response as { data: unknown }).data;
            if (Array.isArray(data)) {
                return data as Notification[];
            }
            if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
                return (data as { data: Notification[] }).data;
            }
        }
        return null;
    }

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
        this.unreadCountSignal.update((count) => count + 1);
    }

    markAsRead(id: string | number): void {
        const current = this.notificationsSignal();
        const target = current.find((n) => n.id === id);
        if (target && !target.read) {
            this.unreadCountSignal.update((count) => Math.max(0, count - 1));
        }

        const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
        this.notificationsSignal.set(updated);

        this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe({
            error: () => this.loadNotifications()
        });
    }

    markAllAsRead(): void {
        const updated = this.notificationsSignal().map((n) => ({ ...n, read: true }));
        this.notificationsSignal.set(updated);
        this.unreadCountSignal.set(0);

        this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe({
            error: () => this.loadNotifications()
        });
    }

    deleteNotification(id: string | number): void {
        const current = this.notificationsSignal();
        const target = current.find((n) => n.id === id);
        if (target && !target.read) {
            this.unreadCountSignal.update((count) => Math.max(0, count - 1));
        }

        const updated = current.filter((n) => n.id !== id);
        this.notificationsSignal.set(updated);

        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            error: () => this.loadNotifications()
        });
    }

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
            info: 'pi-bell',
            missing_freight_rate: 'pi-exclamation-triangle',
            freight_rate_request: 'pi-exclamation-triangle'
        };
        return iconMap[type] || 'pi-bell';
    }

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
            info: 'blue',
            missing_freight_rate: 'orange',
            freight_rate_request: 'orange'
        };
        return colorMap[type] || 'blue';
    }
}
