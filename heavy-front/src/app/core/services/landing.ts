import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubCategory {
    id: number;
    nombre: string;
    slug: string;
    imagen_url: string;
    imagen_secundaria_url: string;
    descripcion: string;
    mostrar_en_navbar?: boolean;
}

export interface Category {
    id: number;
    nombre: string;
    slug: string;
    descripcion_general?: string;
    subcategorias: SubCategory[];
    mostrar_en_navbar?: boolean;
}

export interface LandingBrandDto {
    id: number;
    nombre: string;
    logo?: string;
    logoWidth?: number;
    logoHeight?: number;
    foto?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LandingService {
    private trmUrl = 'https://www.datos.gov.co/resource/32sa-8pi3.json';
    private brandsCache$?: Observable<LandingBrandDto[]>;
    private navbarCache$?: Observable<Category[]>;
    private allCategoriesCache$?: Observable<Category[]>;

    constructor(private http: HttpClient) {}

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
        // Si ya tenemos todas las categorías, las filtramos para el navbar
        if (this.allCategoriesCache$) {
            return this.allCategoriesCache$.pipe(
                map((categories) =>
                    categories
                        .filter((c) => c.mostrar_en_navbar)
                        .map((c) => ({
                            ...c,
                            subcategorias: c.subcategorias.filter((s) => s.mostrar_en_navbar)
                        }))
                )
            );
        }

        if (!this.navbarCache$) {
            this.navbarCache$ = this.http.get<Category[]>(`${environment.apiUrl}/landing/navbar-data`).pipe(
                catchError((error) => {
                    console.error('Error fetching navbar categories:', error);
                    return of([]);
                }),
                shareReplay(1)
            );
        }

        return this.navbarCache$;
    }

    getAllCategories(): Observable<Category[]> {
        if (!this.allCategoriesCache$) {
            this.allCategoriesCache$ = this.http.get<Category[]>(`${environment.apiUrl}/landing/categories`).pipe(
                catchError((error) => {
                    console.error('Error fetching all categories:', error);
                    return of([]);
                }),
                shareReplay(1)
            );
        }

        return this.allCategoriesCache$;
    }

    getBrands(): Observable<LandingBrandDto[]> {
        if (!this.brandsCache$) {
            this.brandsCache$ = this.http.get<LandingBrandDto[]>(`${environment.apiUrl}/landing/brands`).pipe(
                catchError((error) => {
                    console.error('Error fetching brands:', error);
                    return of([]);
                }),
                shareReplay(1)
            );
        }

        return this.brandsCache$;
    }

    getQuoteData(): Observable<any> {
        return this.http
            .get<any>(`${environment.apiUrl}/landing/quote-data`, {
                headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
            })
            .pipe(
                catchError((error) => {
                    console.error('Error fetching quote data:', error);
                    return of({ categories: [], brands: [], systems: [], articleTypes: [], models: [] });
                })
            );
    }

    submitQuote(data: any): Observable<any> {
        const formData = new FormData();

        formData.append('selectedBrand', data.selectedBrand || '');
        formData.append('selectedType', data.selectedType || '');
        formData.append('selectedModel', data.selectedModel || '');
        formData.append('selectedSeries', data.selectedSeries || '');
        formData.append('selectedArrangement', data.selectedArrangement || '');

        Object.keys(data.userData).forEach((key) => {
            let value = data.userData[key];
            if (value && typeof value === 'object' && value.id) {
                formData.append(`userData[${key}]`, value.id);
            } else if (value !== null && value !== undefined) {
                formData.append(`userData[${key}]`, value);
            }
        });

        data.items.forEach((item: any, index: number) => {
            formData.append(`items[${index}][system]`, item.system);
            formData.append(`items[${index}][description]`, item.description || '');
            formData.append(`items[${index}][quantity]`, item.quantity.toString());
            formData.append(`items[${index}][reference]`, item.reference || '');
            if (item.referencia_id) {
                formData.append(`items[${index}][referencia_id]`, item.referencia_id.toString());
            }

            formData.append(`items[${index}][comment]`, item.comment || '');

            if (item.files && item.files.length > 0) {
                item.files.forEach((file: File, fileIndex: number) => {
                    formData.append(`items[${index}][files][${fileIndex}]`, file, file.name);
                });
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
