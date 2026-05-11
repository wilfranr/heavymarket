import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

    getAll(params?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Fabricante>> {
        return this.get<PaginatedResponse<Fabricante>>(this.endpoint, params);
    }
}
