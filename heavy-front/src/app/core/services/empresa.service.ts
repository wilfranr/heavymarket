import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Empresa, CreateEmpresaDto, UpdateEmpresaDto } from '../models/empresa.model';

/**
 * Servicio para gestionar empresas
 */
@Injectable({
    providedIn: 'root'
})
export class EmpresaService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/empresas`;
    }

    /**
     * Obtener todas las empresas con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Empresa>> {
        return this.get<PaginatedResponse<Empresa>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener una empresa por ID
     */
    getById(id: number): Observable<{ data: Empresa }> {
        return this.get<{ data: Empresa }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear una nueva empresa
     */
    create(empresa: CreateEmpresaDto): Observable<{ data: Empresa }> {
        return this.post<{ data: Empresa }>(this.getBaseUrl(), empresa);
    }

    /**
     * Actualizar una empresa
     */
    update(id: number, empresa: UpdateEmpresaDto): Observable<{ data: Empresa }> {
        return this.put<{ data: Empresa }>(`${this.getBaseUrl()}/${id}`, empresa);
    }

    /**
     * Eliminar una empresa
     */
    deleteEmpresa(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
