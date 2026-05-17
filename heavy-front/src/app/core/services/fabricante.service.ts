import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Fabricante } from '../models/fabricante.model';
import { ApiService, PaginatedResponse } from './api.service';

/**
 * Catálogo de fabricantes (solo lectura).
 * Ahora usa el endpoint de listas con tipo='Fabricantes'.
 */
@Injectable({
    providedIn: 'root'
})
export class FabricanteService extends ApiService {
    private readonly endpoint = 'listas/tipo/Fabricantes';
    private cache$ = new Map<string, Observable<PaginatedResponse<Fabricante>>>();

    getAll(params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Fabricante>> {
        const cacheKey = JSON.stringify(params || {});

        if (!this.cache$.has(cacheKey)) {
            const request$ = this.get<PaginatedResponse<Fabricante>>(this.endpoint, params).pipe(shareReplay(1));
            this.cache$.set(cacheKey, request$);
        }

        return this.cache$.get(cacheKey)!;
    }

    /**
     * Limpia la caché de fabricantes.
     */
    clearCache(): void {
        this.cache$.clear();
    }
}
