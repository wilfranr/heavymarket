import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Estrategia de precarga personalizada
 * Precarga módulos lazy después de un delay, mejorando la experiencia inicial
 */
@Injectable({
    providedIn: 'root'
})
export class CustomPreloadStrategy implements PreloadingStrategy {
    /**
     * Precarga módulos con delay de 2 segundos
     * Los módulos con data.preload=false no se precargan
     */
    preload(route: Route, load: () => Observable<any>): Observable<any> {
        if (route.data && route.data['preload'] === false) {
            return of(null);
        }

        // Delay de 2 segundos para no afectar la carga inicial
        return timer(2000).pipe(mergeMap(() => load()));
    }
}
