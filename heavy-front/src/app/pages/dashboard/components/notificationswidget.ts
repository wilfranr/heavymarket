import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [CommonModule, ButtonModule, MenuModule, BadgeModule],
    template: `<div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">
                Notificaciones
                @if (unreadCount() > 0) {
                    <p-badge [value]="unreadCount().toString()" severity="danger" styleClass="ml-2"></p-badge>
                }
            </div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="menuItems"></p-menu>
            </div>
        </div>

        @if (notifications().length === 0) {
            <div class="text-center py-8 text-muted-color">
                <i class="pi pi-bell-slash text-4xl mb-3"></i>
                <p>No hay notificaciones</p>
            </div>
        } @else {
            <div class="max-h-96 overflow-y-auto">
                @for (notification of notifications(); track notification.id) {
                    <div class="flex items-start py-3 border-b border-surface cursor-pointer hover:bg-surface-hover" 
                         (click)="markAsRead(notification.id)"
                         [class.opacity-60]="notification.read">
                        <div class="w-12 h-12 flex items-center justify-center rounded-full mr-4 shrink-0"
                             [class]="'bg-' + notification.iconColor + '-100 dark:bg-' + notification.iconColor + '-400/10'">
                            <i [class]="'pi ' + notification.icon + ' text-xl! text-' + notification.iconColor + '-500'"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-1">
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ notification.title }}</span>
                                @if (!notification.read) {
                                    <span class="w-2 h-2 bg-primary rounded-full ml-2"></span>
                                }
                            </div>
                            <p class="text-surface-700 dark:text-surface-100 text-sm m-0">{{ notification.message }}</p>
                            <span class="text-xs text-muted-color">{{ getTimeAgo(notification.created_at) }}</span>
                        </div>
                    </div>
                }
            </div>
        }
    </div>`
})
export class NotificationsWidget {
    private readonly notificationService = inject(NotificationService);

    notifications = this.notificationService.notifications;
    unreadCount = this.notificationService.unreadCount;

    menuItems = [
        { 
            label: 'Marcar todas como leídas', 
            icon: 'pi pi-fw pi-check',
            command: () => this.markAllAsRead()
        }
    ];

    markAsRead(id: number): void {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return date.toLocaleDateString('es-ES');
    }
}
