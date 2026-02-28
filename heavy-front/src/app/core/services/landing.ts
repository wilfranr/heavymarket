import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubCategory {
    id: number;
    nombre: string;
    slug: string;
    imagen_url: string;
    imagen_secundaria_url: string;
    descripcion: string;
}

export interface Category {
    nombre: string;
    slug: string;
    descripcion_general?: string;
    subcategorias: SubCategory[];
}

@Injectable({
    providedIn: 'root'
})
export class LandingService {
    private trmUrl = 'https://www.datos.gov.co/resource/32sa-8pi3.json';

    constructor(private http: HttpClient) { }

    getTrm(): Observable<number> {
        return this.http.get<any[]>(this.trmUrl).pipe(
            map((data) => {
                if (data && data.length > 0 && data[0].valor) {
                    return parseFloat(data[0].valor);
                }
                return 0;
            }),
            catchError((error) => {
                console.error('Error fetching TRM:', error);
                return of(0);
            })
        );
    }

    getNavbarCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${environment.apiUrl}/landing/navbar-data`).pipe(
            catchError((error) => {
                console.error('Error fetching navbar categories:', error);
                return of([]);
            })
        );
    }

    getAllCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${environment.apiUrl}/landing/categories`).pipe(
            catchError((error) => {
                console.error('Error fetching all categories:', error);
                return of([]);
            })
        );
    }

    getBrands(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/landing/brands`).pipe(
            catchError((error) => {
                console.error('Error fetching brands:', error);
                return of([]);
            })
        );
    }

    getQuoteData(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/landing/quote-data`).pipe(
            catchError((error) => {
                console.error('Error fetching quote data:', error);
                return of({ categories: [], brands: [], systems: [], models: [] });
            })
        );
    }

    submitQuote(data: any): Observable<any> {
        const formData = new FormData();

        // Appending top-level strings
        formData.append('selectedBrand', data.selectedBrand || '');
        formData.append('selectedType', data.selectedType || '');
        formData.append('selectedModel', data.selectedModel || '');
        formData.append('selectedSeries', data.selectedSeries || '');
        formData.append('selectedArrangement', data.selectedArrangement || '');

        // Appending nested userData
        Object.keys(data.userData).forEach(key => {
            let value = data.userData[key];
            if (value && typeof value === 'object' && value.id) {
                formData.append(`userData[${key}]`, value.id);
            } else if (value !== null && value !== undefined) {
                formData.append(`userData[${key}]`, value);
            }
        });

        // Appending items with potential files
        data.items.forEach((item: any, index: number) => {
            formData.append(`items[${index}][system]`, item.system);
            formData.append(`items[${index}][description]`, item.description);
            formData.append(`items[${index}][quantity]`, item.quantity.toString());
            formData.append(`items[${index}][reference]`, item.reference || '');

            if (item.file) {
                formData.append(`items[${index}][file]`, item.file, item.file.name);
            }
        });

        const token = localStorage.getItem('clientToken');
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post<any>(`${environment.apiUrl}/landing/submit-quote`, formData, { headers });
    }
    submitContactForm(data: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/landing/contact`, data).pipe(
            catchError((error) => {
                console.error('Error submitting contact form:', error);
                throw error;
            })
        );
    }
}
