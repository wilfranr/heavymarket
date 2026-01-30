import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SistemaService } from '../../../core/services/sistema.service';
import { ToastService } from '../../../core/services/toast.service';
import * as SistemasActions from '../actions/sistemas.actions';

/**
 * Effects para el módulo de Sistemas
 */
@Injectable()
export class SistemasEffects {
    private actions$ = inject(Actions);
    private sistemaService = inject(SistemaService);
    private toastService = inject(ToastService);

    /**
     * Effect para cargar sistemas
     */
    loadSistemas$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SistemasActions.loadSistemas),
            switchMap(({ search, page, per_page }) =>
                this.sistemaService.getAll({ search, page, per_page }).pipe(
                    map((response) => {
                        return SistemasActions.loadSistemasSuccess({
                            sistemas: response.data,
                            total: response.meta.total,
                            currentPage: response.meta.current_page,
                            lastPage: response.meta.last_page
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar los sistemas';
                        this.toastService.error(message);
                        return of(SistemasActions.loadSistemasFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para cargar sistema por ID
     */
    loadSistemaById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SistemasActions.loadSistemaById),
            switchMap(({ id }) =>
                this.sistemaService.getById(id).pipe(
                    map((response) => {
                        const sistema = response.data;
                        return SistemasActions.loadSistemaByIdSuccess({ sistema });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar el sistema';
                        this.toastService.error(message);
                        return of(SistemasActions.loadSistemaByIdFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para crear sistema
     */
    createSistema$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SistemasActions.createSistema),
            switchMap(({ data }) =>
                this.sistemaService.create(data).pipe(
                    map((response) => {
                        const sistema = response.data;
                        this.toastService.success('Sistema creado exitosamente');
                        return SistemasActions.createSistemaSuccess({ sistema });
                    }),
                    catchError((error) => {
                        let message = 'Error al crear el sistema';

                        if (error.status === 422 && error.error?.errors) {
                            const errors = error.error.errors;
                            const firstError = Object.values(errors)[0] as string[];
                            message = firstError[0] || message;
                        } else if (error.error?.message) {
                            message = error.error.message;
                        }

                        this.toastService.error(message);
                        return of(SistemasActions.createSistemaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para actualizar sistema
     */
    updateSistema$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SistemasActions.updateSistema),
            switchMap(({ id, data }) =>
                this.sistemaService.update(id, data).pipe(
                    map((response) => {
                        const sistema = response.data;
                        this.toastService.success('Sistema actualizado exitosamente');
                        return SistemasActions.updateSistemaSuccess({ sistema });
                    }),
                    catchError((error) => {
                        let message = 'Error al actualizar el sistema';

                        if (error.status === 422 && error.error?.errors) {
                            const errors = error.error.errors;
                            const firstError = Object.values(errors)[0] as string[];
                            message = firstError[0] || message;
                        } else if (error.error?.message) {
                            message = error.error.message;
                        }

                        this.toastService.error(message);
                        return of(SistemasActions.updateSistemaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para eliminar sistema
     */
    deleteSistema$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SistemasActions.deleteSistema),
            switchMap(({ id }) =>
                this.sistemaService.deleteSistema(id).pipe(
                    map(() => {
                        this.toastService.success('Sistema eliminado exitosamente');
                        return SistemasActions.deleteSistemaSuccess({ id });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al eliminar el sistema';
                        this.toastService.error(message);
                        return of(SistemasActions.deleteSistemaFailure({ error: message }));
                    })
                )
            )
        )
    );
}
