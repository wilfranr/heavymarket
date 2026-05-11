import { Directive, Input, HostBinding, HostListener } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Directiva para manejar imágenes faltantes o rotas.
 * Si la imagen falla al cargar o el src está vacío, se muestra una imagen genérica.
 *
 * Uso: <img src="url" appFallbackImage />
 */
@Directive({
    selector: 'img[appFallbackImage]',
    standalone: true
})
export class FallbackImageDirective {
    /**
     * Imagen personalizada de fallback si se desea una diferente a la global
     */
    @Input() appFallbackImage?: string;

    private readonly globalFallback = `${environment.apiBaseUrl}/images/no-image.png`;

    @HostBinding('src')
    @Input()
    src?: string;

    /**
     * Al inicializar o cambiar el src
     */
    ngOnChanges(): void {
        if (!this.src || this.src.trim() === '') {
            this.src = this.appFallbackImage || this.globalFallback;
        }
    }

    /**
     * Maneja el error de carga de la imagen
     */
    @HostListener('error')
    onError(): void {
        this.src = this.appFallbackImage || this.globalFallback;
    }
}
