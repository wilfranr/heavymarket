import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Estadísticas del dashboard
 */
export interface DashboardStats {
    pedidos: number;
    cotizaciones: number;
    terceros: number;
    ordenes: number;
}

export interface RevenueStream {
    labels: string[];
    data: number[];
}

export interface BestSellingProduct {
    nombre: string;
    codigo: string;
    total_quantity: number;
    total_value: number;
}

export interface DashboardNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    iconColor: string;
    read: boolean;
    created_at: string;
}

/**
 * Servicio para obtener estadísticas del dashboard
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardService extends ApiService {
    /**
     * Obtiene las estadísticas generales del sistema
     */
    getStats(): Observable<DashboardStats> {
        return this.get<DashboardStats>('dashboard/stats');
    }

    /**
     * Obtiene el flujo de ingresos
     */
    getRevenueStream(): Observable<RevenueStream> {
        return this.get<RevenueStream>('dashboard/revenue-stream');
    }

    /**
     * Obtiene los productos más vendidos
     */
    getBestSelling(): Observable<BestSellingProduct[]> {
        return this.get<BestSellingProduct[]>('dashboard/best-selling');
    }

    /**
     * Obtiene las notificaciones recientes
     */
    getNotifications(): Observable<DashboardNotification[]> {
        return this.get<DashboardNotification[]>('dashboard/notifications');
    }
}
