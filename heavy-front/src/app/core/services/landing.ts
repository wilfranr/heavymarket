import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    // Mock data based on typical heavy machinery categories
    const mockCategories: Category[] = [
      {
        nombre: 'Motor',
        slug: 'motor',
        subcategorias: [
          { nombre: 'Cigüeñales', slug: 'ciguenales', imagen_url: '/assets/images/motor.png', descripcion: 'Cigüeñales de alta resistencia.' },
          { nombre: 'Pistones', slug: 'pistones', imagen_url: '/assets/images/motor.png', descripcion: 'Juegos de pistones completos.' },
          { nombre: 'Inyectores', slug: 'inyectores', imagen_url: '/assets/images/motor.png', descripcion: 'Inyectores diésel de precisión.' }
        ]
      },
      {
        nombre: 'Hidráulico',
        slug: 'hidraulico',
        subcategorias: [
          { nombre: 'Bombas', slug: 'bombas', imagen_url: '/assets/images/hidraulico.png', descripcion: 'Bombas hidráulicas de engranajes y pistones.' },
          { nombre: 'Cilindros', slug: 'cilindros', imagen_url: '/assets/images/hidraulico.png', descripcion: 'Cilindros hidráulicos para maquinaria.' }
        ]
      },
      {
        nombre: 'Rodaje',
        slug: 'rodaje',
        subcategorias: [
          { nombre: 'Cadenas', slug: 'cadenas', imagen_url: '/assets/images/trenes-rodaje.png', descripcion: 'Cadenas completas para excavadoras.' },
          { nombre: 'Rodillos', slug: 'rodillos', imagen_url: '/assets/images/trenes-rodaje.png', descripcion: 'Rodillos superiores e inferiores.' }
        ]
      },
      {
        nombre: 'Eléctrico',
        slug: 'electrico',
        subcategorias: [
          { nombre: 'Alternadores', slug: 'alternadores', imagen_url: '/assets/images/sistema-electrico.png', descripcion: 'Alternadores de alto amperaje.' },
          { nombre: 'Sensores', slug: 'sensores', imagen_url: '/assets/images/sistema-electrico.png', descripcion: 'Sensores de presión y temperatura.' }
        ]
      },
      {
        nombre: 'Herramientas de Corte',
        slug: 'corte',
        subcategorias: [
          { nombre: 'Dientes', slug: 'dientes', imagen_url: '/assets/images/herramienta-corte.png', descripcion: 'Dientes para cucharones.' }
        ]
      }
    ];
    return of(mockCategories);
  }
}
