import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { MessageService } from 'primeng/api';
import * as CotizacionesActions from '../actions/cotizaciones.actions';

/**
 * Effects para el módulo de Cotizaciones
 */
@Injectable()
export class CotizacionesEffects {
    private actions$ = inject(Actions);
    private cotizacionService = inject(CotizacionService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    /**
     * Effect para cargar cotizaciones
     */
    loadCotizaciones$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CotizacionesActions.loadCotizaciones),
            switchMap(({ estado, tercero_id, pedido_id, page, per_page }) =>
                this.cotizacionService.getAll({ estado, tercero_id, pedido_id, page, per_page }).pipe(
                    map((response) => {
                        return CotizacionesActions.loadCotizacionesSuccess({
                            cotizaciones: response.data,
                            total: response.meta.total,
                            currentPage: response.meta.current_page,
                            lastPage: response.meta.last_page
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar las cotizaciones';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CotizacionesActions.loadCotizacionesFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para cargar cotización por ID
     */
    loadCotizacionById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CotizacionesActions.loadCotizacionById),
            switchMap(({ id }) =>
                this.cotizacionService.getById(id).pipe(
                    map((response) => {
                        return CotizacionesActions.loadCotizacionByIdSuccess({
                            cotizacion: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar la cotización';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CotizacionesActions.loadCotizacionByIdFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para crear cotización
     */
    createCotizacion$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CotizacionesActions.createCotizacion),
            switchMap(({ data }) =>
                this.cotizacionService.create(data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Cotización creada exitosamente'
                        });
                        return CotizacionesActions.createCotizacionSuccess({
                            cotizacion: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al crear la cotización';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CotizacionesActions.createCotizacionFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para actualizar cotización
     */
    updateCotizacion$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CotizacionesActions.updateCotizacion),
            switchMap(({ id, data }) =>
                this.cotizacionService.update(id, data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Cotización actualizada exitosamente'
                        });
                        return CotizacionesActions.updateCotizacionSuccess({
                            cotizacion: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al actualizar la cotización';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CotizacionesActions.updateCotizacionFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para eliminar cotización
     */
    deleteCotizacion$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CotizacionesActions.deleteCotizacion),
            switchMap(({ id }) =>
                this.cotizacionService.deleteCotizacion(id).pipe(
                    map(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Cotización eliminada exitosamente'
                        });
                        return CotizacionesActions.deleteCotizacionSuccess({ id });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al eliminar la cotización';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CotizacionesActions.deleteCotizacionFailure({ error: message }));
                    })
                )
            )
        )
    );
}
