import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Maquina, CreateMaquinaDto, UpdateMaquinaDto } from '../models/maquina.model';
import { ApiService, PaginatedResponse, ApiResponse } from './api.service';

/**
 * Servicio para gestión de Máquinas
 *
 * Maneja todas las operaciones CRUD de máquinas
 */
@Injectable({
    providedIn: 'root'
})
export class MaquinaService extends ApiService {
    private readonly endpoint = 'maquinas';

    /**
     * Obtener todas las máquinas con filtros
     */
    getAll(params?: { search?: string; fabricante_id?: number; tipo?: number; sort_by?: string; sort_order?: 'asc' | 'desc'; per_page?: number; page?: number }): Observable<PaginatedResponse<Maquina>> {
        return this.get<PaginatedResponse<Maquina>>(this.endpoint, params);
    }

    /**
     * Obtener una máquina por ID
     */
    getById(id: number): Observable<ApiResponse<Maquina>> {
        return this.get<ApiResponse<Maquina>>(`${this.endpoint}/${id}`);
    }

    /**
     * Crear una nueva máquina
     */
    create(data: CreateMaquinaDto): Observable<ApiResponse<Maquina>> {
        return this.post<ApiResponse<Maquina>>(this.endpoint, data);
    }

    /**
     * Actualizar una máquina existente
     */
    update(id: number, data: UpdateMaquinaDto): Observable<ApiResponse<Maquina>> {
        return this.put<ApiResponse<Maquina>>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Eliminar una máquina
     */
    deleteMaquina(id: number): Observable<any> {
        return this.delete(`${this.endpoint}/${id}`);
    }
}
