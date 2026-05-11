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
    estado: boolean;
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
    estado: boolean;
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

    createCategory(data: Partial<CategoriaLanding>): Observable<CategoriaLanding> {
        return this.post<CategoriaLanding>('landing/categorias', data);
    }

    updateCategory(id: number, data: Partial<CategoriaLanding>): Observable<CategoriaLanding> {
        return this.put<CategoriaLanding>(`landing/categorias/${id}`, data);
    }

    deleteCategory(id: number): Observable<any> {
        return this.delete<any>(`landing/categorias/${id}`);
    }

    createSubcategory(data: Partial<SubcategoriaLanding>): Observable<SubcategoriaLanding> {
        return this.post<SubcategoriaLanding>('landing/subcategorias', data);
    }

    updateSubcategory(id: number, data: Partial<SubcategoriaLanding>): Observable<SubcategoriaLanding> {
        return this.put<SubcategoriaLanding>(`landing/subcategorias/${id}`, data);
    }

    deleteSubcategory(id: number): Observable<any> {
        return this.delete<any>(`landing/subcategorias/${id}`);
    }

    /**
     * Crear subcategoría incluyendo una posible imagen (multipart/form-data)
     */
    createSubcategoryWithImage(data: Partial<SubcategoriaLanding>, imagenFile?: File): Observable<SubcategoriaLanding> {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        if (imagenFile) {
            formData.append('imagen', imagenFile);
        }

        return this.post<SubcategoriaLanding>('landing/subcategorias', formData);
    }

    /**
     * Actualizar subcategoría incluyendo gestión de imagen (multipart/form-data)
     * Usa method spoofing para compatibilidad con Laravel.
     */
    updateSubcategoryWithImage(id: number, data: Partial<SubcategoriaLanding>, imagenFile?: File | null, removeImagen?: boolean): Observable<SubcategoriaLanding> {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        if (imagenFile) {
            formData.append('imagen', imagenFile);
        }

        if (removeImagen) {
            formData.append('remove_imagen', '1');
        }

        return this.post<SubcategoriaLanding>(`landing/subcategorias/${id}`, formData);
    }

    updateLista(id: number, data: any): Observable<any> {
        return this.put<any>(`listas/${id}`, data);
    }

    getContactLeads(): Observable<any[]> {
        return this.get<any[]>('landing/contact-leads');
    }

    updateContactLeadStatus(id: number, estado: string): Observable<any> {
        return this.put<any>(`landing/contact-leads/${id}/status`, { estado });
    }
}
