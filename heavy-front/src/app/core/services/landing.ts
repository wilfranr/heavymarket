import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubCategory {
  nombre: string;
  slug: string;
  imagen_url: string;
  descripcion: string;
}

export interface Category {
  nombre: string;
  slug: string;
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
      map(data => {
        if (data && data.length > 0 && data[0].valor) {
          return parseFloat(data[0].valor);
        }
        return 0;
      }),
      catchError(error => {
        console.error('Error fetching TRM:', error);
        return of(0);
      })
    );
  }

  getNavbarCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/landing/categories`).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }
}
