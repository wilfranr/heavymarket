import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Precarga opt-in: solo rutas con data.preload === true (p. ej. landing, cotizar).
 * Evita cargar chunks de /app sin el contexto de effects y sin activar inject(Store) en preload.
 */
@Injectable({
    providedIn: 'root'
})
export class CustomPreloadStrategy implements PreloadingStrategy {
    preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
        if (route.data?.['preload'] !== true) {
            return of(null);
        }

        return timer(2000).pipe(mergeMap(() => load()));
    }
}
