import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, StatsWidget, RecentSalesWidget, BestSellingWidget, RevenueStreamWidget, NotificationsWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <!-- Widgets de estadísticas superiores -->
            <app-stats-widget class="contents" />

            <!-- Pedidos Recientes (Ancho completo) -->
            <div class="col-span-12">
                <app-recent-sales-widget />
            </div>

            <!-- Gráfico de Ingresos (Solo SuperAdmin) -->
            <div *ngIf="isSuperAdmin" class="col-span-12">
                <app-revenue-stream-widget />
            </div>

            <!-- Productos y Notificaciones (Lado a lado o apilados en móvil) -->
            <div class="col-span-12 xl:col-span-6">
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-notifications-widget />
            </div>
        </div>
    `
})
export class Dashboard {
    private authService = inject(AuthService);

    get isSuperAdmin(): boolean {
        return this.authService.hasRole('super_admin');
    }
}
