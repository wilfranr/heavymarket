import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SubcategoriaLanding {
    id: number;
    categoria_id: number;
    nombre: string;
    descripcion?: string;
    imagen?: string;
    mostrar_en_navbar: boolean;
    orden_navbar?: number;
    slug?: string;
    imagen_url?: string;
    is_expanded?: boolean; // UI helper
}

export interface CategoriaLanding {
    id: number;
    nombre: string;
    descripcion_general?: string;
    mostrar_en_navbar: boolean;
    orden_navbar?: number;
    subcategorias?: SubcategoriaLanding[];
    slug?: string;
    parent_id?: number | null; // Added for hierarchical listas
    children?: CategoriaLanding[]; // Added for hierarchical listas
}

@Injectable({
    providedIn: 'root'
})
export class LandingManageService extends ApiService {

    getAdminCategories(): Observable<CategoriaLanding[]> {
        return this.get<CategoriaLanding[]>('landing/categorias');
    }

    getAdminMachineTypes(): Observable<CategoriaLanding[]> {
        return this.get<CategoriaLanding[]>('landing/machine-types');
    }

    updateCategory(id: number, data: Partial<CategoriaLanding>): Observable<CategoriaLanding> {
        return this.put<CategoriaLanding>(`landing/categorias/${id}`, data);
    }

    updateSubcategory(id: number, data: Partial<SubcategoriaLanding>): Observable<SubcategoriaLanding> {
        return this.put<SubcategoriaLanding>(`landing/subcategorias/${id}`, data);
    }

    updateLista(id: number, data: any): Observable<any> {
        return this.put<any>(`listas/${id}`, data);
    }
}
