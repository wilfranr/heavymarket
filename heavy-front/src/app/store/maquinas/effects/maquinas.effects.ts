import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MaquinaService } from '../../../core/services/maquina.service';
import { ToastService } from '../../../core/services/toast.service';
import * as MaquinasActions from '../actions/maquinas.actions';

/**
 * Effects para el módulo de Máquinas
 */
@Injectable()
export class MaquinasEffects {
    private actions$ = inject(Actions);
    private maquinaService = inject(MaquinaService);
    private toastService = inject(ToastService);

    /**
     * Effect para cargar máquinas
     */
    loadMaquinas$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MaquinasActions.loadMaquinas),
            switchMap(({ search, fabricante_id, tipo, page, per_page }) =>
                this.maquinaService.getAll({ search, fabricante_id, tipo, page, per_page }).pipe(
                    map((response) => {
                        return MaquinasActions.loadMaquinasSuccess({
                            maquinas: response.data,
                            total: response.meta.total,
                            currentPage: response.meta.current_page,
                            lastPage: response.meta.last_page
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar las máquinas';
                        this.toastService.error(message);
                        return of(MaquinasActions.loadMaquinasFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para cargar máquina por ID
     */
    loadMaquinaById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MaquinasActions.loadMaquinaById),
            switchMap(({ id }) =>
                this.maquinaService.getById(id).pipe(
                    map((response) => {
                        const maquina = response.data;
                        return MaquinasActions.loadMaquinaByIdSuccess({ maquina });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar la máquina';
                        this.toastService.error(message);
                        return of(MaquinasActions.loadMaquinaByIdFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para crear máquina
     */
    createMaquina$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MaquinasActions.createMaquina),
            switchMap(({ data }) =>
                this.maquinaService.create(data).pipe(
                    map((response) => {
                        const maquina = response.data;
                        this.toastService.success('Máquina creada exitosamente');
                        return MaquinasActions.createMaquinaSuccess({ maquina });
                    }),
                    catchError((error) => {
                        let message = 'Error al crear la máquina';

                        if (error.status === 422 && error.error?.errors) {
                            const errors = error.error.errors;
                            const firstError = Object.values(errors)[0] as string[];
                            message = firstError[0] || message;
                        } else if (error.error?.message) {
                            message = error.error.message;
                        }

                        this.toastService.error(message);
                        return of(MaquinasActions.createMaquinaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para actualizar máquina
     */
    updateMaquina$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MaquinasActions.updateMaquina),
            switchMap(({ id, data }) =>
                this.maquinaService.update(id, data).pipe(
                    map((response) => {
                        const maquina = response.data;
                        this.toastService.success('Máquina actualizada exitosamente');
                        return MaquinasActions.updateMaquinaSuccess({ maquina });
                    }),
                    catchError((error) => {
                        let message = 'Error al actualizar la máquina';

                        if (error.status === 422 && error.error?.errors) {
                            const errors = error.error.errors;
                            const firstError = Object.values(errors)[0] as string[];
                            message = firstError[0] || message;
                        } else if (error.error?.message) {
                            message = error.error.message;
                        }

                        this.toastService.error(message);
                        return of(MaquinasActions.updateMaquinaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para eliminar máquina
     */
    deleteMaquina$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MaquinasActions.deleteMaquina),
            switchMap(({ id }) =>
                this.maquinaService.deleteMaquina(id).pipe(
                    map(() => {
                        this.toastService.success('Máquina eliminada exitosamente');
                        return MaquinasActions.deleteMaquinaSuccess({ id });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al eliminar la máquina';
                        this.toastService.error(message);
                        return of(MaquinasActions.deleteMaquinaFailure({ error: message }));
                    })
                )
            )
        )
    );
}
