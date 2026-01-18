import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Estadísticas del dashboard
 */
export interface DashboardStats {
    total_pedidos: number;
    pedidos_nuevos: number;
    total_cotizaciones: number;
    total_terceros: number;
    terceros_nuevos: number;
    total_ordenes: number;
}

/**
 * Servicio para obtener estadísticas del dashboard
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly api = inject(ApiService);

    /**
     * Obtiene las estadísticas generales del sistema
     */
    getStats(): Observable<DashboardStats> {
        return this.api.get<DashboardStats>('/dashboard/stats');
    }
}
