import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from './api.service';
import { Contacto, CreateContactoDto, UpdateContactoDto } from '../models/contacto.model';

/**
 * Servicio para gestionar contactos
 */
@Injectable({
    providedIn: 'root'
})
export class ContactoService extends ApiService {
    protected getBaseUrl(): string {
        return `${this.API_URL}/contactos`;
    }

    /**
     * Obtener todos los contactos con filtros
     */
    getAll(params?: QueryParams): Observable<PaginatedResponse<Contacto>> {
        return this.get<PaginatedResponse<Contacto>>(this.getBaseUrl(), params);
    }

    /**
     * Obtener un contacto por ID
     */
    getById(id: number): Observable<{ data: Contacto }> {
        return this.get<{ data: Contacto }>(`${this.getBaseUrl()}/${id}`);
    }

    /**
     * Crear un nuevo contacto
     */
    create(contacto: CreateContactoDto): Observable<{ data: Contacto }> {
        return this.post<{ data: Contacto }>(this.getBaseUrl(), contacto);
    }

    /**
     * Actualizar un contacto
     */
    update(id: number, contacto: UpdateContactoDto): Observable<{ data: Contacto }> {
        return this.put<{ data: Contacto }>(`${this.getBaseUrl()}/${id}`, contacto);
    }

    /**
     * Eliminar un contacto
     */
    deleteContacto(id: number): Observable<void> {
        return this.delete<void>(`${this.getBaseUrl()}/${id}`);
    }
}
