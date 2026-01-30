import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TransportadoraService } from '../../../core/services/transportadora.service';
import { MessageService } from 'primeng/api';
import * as TransportadorasActions from '../actions/transportadoras.actions';

/**
 * Effects para el módulo de Transportadoras
 */
@Injectable()
export class TransportadorasEffects {
    private actions$ = inject(Actions);
    private transportadoraService = inject(TransportadoraService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    /**
     * Effect para cargar transportadoras
     */
    loadTransportadoras$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TransportadorasActions.loadTransportadoras),
            switchMap(({ page, per_page, search }) =>
                this.transportadoraService.getAll({ page, per_page, search }).pipe(
                    map((response) => {
                        return TransportadorasActions.loadTransportadorasSuccess({
                            transportadoras: response.data,
                            total: response.meta.total,
                            currentPage: response.meta.current_page,
                            lastPage: response.meta.last_page
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar las transportadoras';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(TransportadorasActions.loadTransportadorasFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para cargar transportadora por ID
     */
    loadTransportadoraById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TransportadorasActions.loadTransportadoraById),
            switchMap(({ id }) =>
                this.transportadoraService.getById(id).pipe(
                    map((response) => {
                        return TransportadorasActions.loadTransportadoraByIdSuccess({
                            transportadora: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar la transportadora';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(TransportadorasActions.loadTransportadoraByIdFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para crear transportadora
     */
    createTransportadora$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TransportadorasActions.createTransportadora),
            switchMap(({ data }) =>
                this.transportadoraService.create(data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Transportadora creada exitosamente'
                        });
                        return TransportadorasActions.createTransportadoraSuccess({
                            transportadora: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al crear la transportadora';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(TransportadorasActions.createTransportadoraFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para actualizar transportadora
     */
    updateTransportadora$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TransportadorasActions.updateTransportadora),
            switchMap(({ id, data }) =>
                this.transportadoraService.update(id, data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Transportadora actualizada exitosamente'
                        });
                        return TransportadorasActions.updateTransportadoraSuccess({
                            transportadora: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al actualizar la transportadora';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(TransportadorasActions.updateTransportadoraFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para eliminar transportadora
     */
    deleteTransportadora$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TransportadorasActions.deleteTransportadora),
            switchMap(({ id }) =>
                this.transportadoraService.deleteTransportadora(id).pipe(
                    map(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Transportadora eliminada exitosamente'
                        });
                        return TransportadorasActions.deleteTransportadoraSuccess({ id });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al eliminar la transportadora';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(TransportadorasActions.deleteTransportadoraFailure({ error: message }));
                    })
                )
            )
        )
    );
}
