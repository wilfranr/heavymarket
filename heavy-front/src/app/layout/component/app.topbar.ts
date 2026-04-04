import { Component, inject, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleClassModule } from 'primeng/styleclass';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { MenuModule } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { LayoutService } from '../service/layout.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { GlobalSearchService, SearchResult } from '../../core/services/global-search.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, StyleClassModule, BadgeModule, PopoverModule, MenuModule, InputTextModule, IconFieldModule, InputIconModule, AutoCompleteModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/app">
                <img [src]="layoutService.isDarkTheme() ? 'assets/images/logo.svg' : 'assets/images/logo-black.svg'" alt="CYH Heavy Market" style="height: 35px; width: auto;" />
            </a>
        </div>

        <div class="flex-1 flex items-center justify-center px-4 hidden lg:flex">
            <p-autoComplete 
                [(ngModel)]="selectedSearchResult" 
                [suggestions]="searchResults" 
                (completeMethod)="onSearch($event)" 
                field="title" 
                placeholder="Buscar pedidos, terceros, artículos, listas..." 
                [style]="{'width':'100%', 'max-width':'600px'}" 
                [inputStyle]="{'width':'100%', 'border-radius': '20px', 'padding-left': '2.5rem'}" 
                styleClass="w-full max-w-[600px] relative"
                (onSelect)="onSearchSelect($event)">
                
                <ng-template pTemplate="content">
                    <i class="pi pi-search absolute left-4 text-gray-500" style="top: 50%; transform: translateY(-50%); z-index: 1;"></i>
                </ng-template>

                <ng-template let-item pTemplate="item">
                    <div class="flex items-center gap-3 py-1">
                        <i [ngClass]="getSearchIcon(item.type)" class="text-xl text-primary"></i>
                        <div class="flex-1">
                            <div class="font-bold">{{ item.title }}</div>
                            <div class="text-sm text-gray-500">{{ item.description }}</div>
                        </div>
                        <span class="ml-auto text-xs px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded capitalize">{{ item.type }}</span>
                    </div>
                </ng-template>
            </p-autoComplete>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action relative" (click)="notificationsPanel.toggle($event)">
                        <i class="pi pi-bell" pBadge [value]="unreadCount().toString()" severity="danger" *ngIf="unreadCount() > 0"></i>
                        <i class="pi pi-bell" *ngIf="unreadCount() === 0"></i>
                        <span>Notificaciones</span>
                    </button>
                    <button type="button" class="layout-topbar-action" routerLink="/auth/login" *ngIf="!isAuthenticated()">
                        <i class="pi pi-sign-in"></i>
                        <span>Iniciar Sesión</span>
                    </button>
                    <div class="flex items-center gap-3 ml-2" *ngIf="isAuthenticated()">
                        <div class="text-right hidden lg:block cursor-pointer" (click)="profileMenu.toggle($event)">
                            <div class="font-semibold text-sm text-color leading-none mb-1">{{ currentUser()?.name || 'Usuario' }}</div>
                            <div class="text-xs text-muted-color capitalize leading-none">{{ currentUser()?.roles?.[0] || 'Usuario' }}</div>
                        </div>
                        <button type="button" class="layout-topbar-action" #profileMenuButton (click)="profileMenu.toggle($event)">
                            <i class="pi pi-user"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <p-menu #profileMenu [model]="profileMenuItems" [popup]="true"></p-menu>

        <p-popover #notificationsPanel [style]="{ width: '400px', 'max-height': '500px', 'overflow-y': 'auto' }">
            <ng-template pTemplate="content">
                <div class="p-3">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-semibold m-0">Notificaciones</h3>
                        <button type="button" class="p-button-text p-button-sm" pButton label="Marcar todas como leídas" (click)="markAllAsRead()"></button>
                    </div>
                    @if (notifications().length === 0) {
                        <div class="text-center py-4 text-muted-color">
                            <i class="pi pi-bell-slash text-3xl mb-2"></i>
                            <p class="m-0">No hay notificaciones</p>
                        </div>
                    } @else {
                        @for (notification of notifications(); track notification.id) {
                            <div class="flex items-start p-2 mb-2 cursor-pointer hover:bg-surface-hover rounded-border" [class.opacity-60]="notification.read" (click)="markNotificationAsRead(notification.id)">
                                <div class="w-10 h-10 flex items-center justify-center rounded-full mr-3 shrink-0" [class]="'bg-' + notification.iconColor + '-100 dark:bg-' + notification.iconColor + '-400/10'">
                                    <i [class]="'pi ' + notification.icon + ' text-' + notification.iconColor + '-500'"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between items-start mb-1">
                                        <span class="font-semibold text-sm">{{ notification.title }}</span>
                                        @if (!notification.read) {
                                            <span class="w-2 h-2 bg-primary rounded-full ml-2"></span>
                                        }
                                    </div>
                                    <p class="text-sm m-0 text-muted-color">{{ notification.message }}</p>
                                    <span class="text-xs text-muted-color">{{ getTimeAgo(notification.created_at) }}</span>
                                </div>
                            </div>
                        }
                    }
                </div>
            </ng-template>
        </p-popover>
    </div>`
})
export class AppTopbar {
    private readonly notificationService = inject(NotificationService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly searchService = inject(GlobalSearchService);
    public readonly layoutService = inject(LayoutService);

    @ViewChild('profileMenu') profileMenu: any;

    notifications = this.notificationService.notifications;
    unreadCount = this.notificationService.unreadCount;
    currentUser = this.authService.currentUser;
    isAuthenticated = this.authService.isAuthenticated;

    searchQuery = '';
    selectedSearchResult: any = null;
    searchResults: SearchResult[] = [];

    items!: MenuItem[];

    profileMenuItems: MenuItem[] = [
        {
            label: 'Mi Perfil',
            icon: 'pi pi-user',
            command: () => {
                this.router.navigate(['/app/profile']);
            }
        },
        {
            label: 'Configuración',
            icon: 'pi pi-cog',
            command: () => {
                // TODO: Navegar a página de configuración cuando esté implementada
                console.log('Ir a configuración');
            }
        },
        {
            separator: true
        },
        {
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            command: () => {
                this.logout();
            }
        }
    ];

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    onSearch(event: any): void {
        const query = event.query;
        if (query && query.length >= 2) {
            this.searchService.search(query).subscribe({
                next: (res) => {
                    this.searchResults = res.data;
                },
                error: (err) => {
                    console.error('Search error', err);
                    this.searchResults = [];
                }
            });
        } else {
            this.searchResults = [];
        }
    }

    onSearchSelect(event: any): void {
        if (event && event.value) {
            const item: SearchResult = event.value;
            // Navigate to the specific route
            // Depending on the type, we might want to navigate to a detail page.
            // For now, redirect to the list module or specific entity if ID is provided.
            let navRoute = item.route;

            // Logica para rutas con ID  (ej: /app/pedidos/10)
            if (['pedido', 'cotizacion', 'tercero', 'articulo', 'maquina'].includes(item.type)) {
                navRoute = `${item.route}/${item.id}`;
            }

            this.router.navigate([navRoute]);
            this.selectedSearchResult = null; // Clear search on select
        }
    }

    getSearchIcon(type: string): string {
        switch (type) {
            case 'pedido': return 'pi pi-shopping-cart';
            case 'cotizacion': return 'pi pi-file';
            case 'tercero': return 'pi pi-users';
            case 'articulo': return 'pi pi-box';
            case 'referencia': return 'pi pi-hashtag';
            case 'maquina': return 'pi pi-cog';
            case 'sistema': return 'pi pi-wrench';
            case 'lista': return 'pi pi-list-check';
            case 'fabricante': return 'pi pi-globe';
            default: return 'pi pi-search';
        }
    }

    performSearch(): void {
        if (this.searchQuery.trim()) {
            this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
        }
    }

    markNotificationAsRead(id: string | number): void {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/auth/login']);
            },
            error: (error) => {
                // Si hay error, limpiar datos localmente y redirigir de todas formas
                console.error('Error al cerrar sesión:', error);
                this.router.navigate(['/auth/login']);
            }
        });
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
