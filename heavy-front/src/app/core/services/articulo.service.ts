import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Articulo, ArticuloJuego, CreateArticuloDto, Medida, UpdateArticuloDto } from '../models/articulo.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Artículos
 *
 * Maneja todas las operaciones CRUD de artículos
 */
@Injectable({
    providedIn: 'root'
})
export class ArticuloService extends ApiService {
    private readonly endpoint = 'articulos';

    /**
     * Obtener todos los artículos con filtros
     */
    getAll(params?: { search?: string; definicion?: string; sistema_id?: number; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Articulo>> {
        return this.get<PaginatedResponse<Articulo>>(this.endpoint, params);
    }

    /**
     * Obtener un artículo por ID
     */
    getById(id: number): Observable<ApiResponse<Articulo>> {
        return this.get<ApiResponse<Articulo>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear un nuevo artículo
     */
    create(data: CreateArticuloDto | FormData): Observable<ApiResponse<Articulo>> {
        return this.post<ApiResponse<Articulo>>(this.endpoint, data);
    }

    /**
     * Actualizar un artículo existente
     */
    update(id: number, data: UpdateArticuloDto | FormData): Observable<ApiResponse<Articulo>> {
        // Al usar FormData con PUT, algunos servidores PHP/Laravel no lo procesan correctamente.
        // Se suele usar POST con _method=PUT o simplemente POST si se configura bien.
        // Pero aquí usaremos PUT directamente si no es FormData, y para FormData usaremos POST con spoofing si es necesario.
        if (data instanceof FormData) {
            // Spoofing PUT method for Laravel with FormData
            data.append('_method', 'PUT');
            return this.post<ApiResponse<Articulo>>(`${this.endpoint}/${id}`, data);
        }
        return this.put<ApiResponse<ApiResponse<Articulo>>>(`${this.endpoint}/${id}`, data) as any;
    }

    deleteArticulo(id: number): Observable<any> {
        return this.delete(`${this.endpoint}/${id}`);
    }

    /**
     * Gestión de Referencias Cruzadas
     */
    addReferencia(articuloId: number, referenciaId: number): Observable<ApiResponse<Articulo>> {
        return this.post<ApiResponse<Articulo>>(`${this.endpoint}/${articuloId}/referencias`, { referencia_id: referenciaId });
    }

    removeReferencia(articuloId: number, referenciaId: number): Observable<ApiResponse<Articulo>> {
        return this.delete(`${this.endpoint}/${articuloId}/referencias/${referenciaId}`);
    }

    /**
     * Gestión de Juegos (Kits)
     */
    addJuego(articuloId: number, data: { referencia_id: number; cantidad: number; comentario?: string }): Observable<ApiResponse<Articulo>> {
        return this.post<ApiResponse<Articulo>>(`${this.endpoint}/${articuloId}/juegos`, data);
    }

    removeJuego(articuloId: number, referenciaId: number): Observable<ApiResponse<Articulo>> {
        return this.delete(`${this.endpoint}/${articuloId}/juegos/${referenciaId}`);
    }

    /**
     * Gestión de Medidas Técnicas
     */
    addMedida(articuloId: number, data: Omit<Medida, 'id' | 'articulo_id'>): Observable<ApiResponse<Articulo>> {
        return this.post<ApiResponse<Articulo>>(`${this.endpoint}/${articuloId}/medidas`, data);
    }

    updateMedida(articuloId: number, medidaId: number, data: Partial<Medida>): Observable<ApiResponse<Articulo>> {
        return this.put<ApiResponse<Articulo>>(`${this.endpoint}/${articuloId}/medidas/${medidaId}`, data);
    }

    removeMedida(articuloId: number, medidaId: number): Observable<ApiResponse<Articulo>> {
        return this.delete(`${this.endpoint}/${articuloId}/medidas/${medidaId}`);
    }
}
