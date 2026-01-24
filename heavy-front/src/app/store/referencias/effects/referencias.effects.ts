import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { ToastService } from '../../../core/services/toast.service';
import * as ReferenciasActions from '../actions/referencias.actions';

/**
 * Effects para el módulo de Referencias
 */
@Injectable()
export class ReferenciasEffects {
  private actions$ = inject(Actions);
  private referenciaService = inject(ReferenciaService);
  private toastService = inject(ToastService);

  /**
   * Effect para cargar referencias
   */
  loadReferencias$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenciasActions.loadReferencias),
      switchMap(({ search, marca_id, page, per_page }) =>
        this.referenciaService.getAll({ search, marca_id, page, per_page }).pipe(
          map((response) => {
            return ReferenciasActions.loadReferenciasSuccess({
              referencias: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las referencias';
            this.toastService.error(message);
            return of(ReferenciasActions.loadReferenciasFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar referencia por ID
   */
  loadReferenciaById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenciasActions.loadReferenciaById),
      switchMap(({ id }) =>
        this.referenciaService.getById(id).pipe(
          map((response) => {
            const referencia = response.data;
            return ReferenciasActions.loadReferenciaByIdSuccess({ referencia });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la referencia';
            this.toastService.error(message);
            return of(ReferenciasActions.loadReferenciaByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear referencia
   */
  createReferencia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenciasActions.createReferencia),
      switchMap(({ data }) =>
        this.referenciaService.create(data).pipe(
          map((response) => {
            const referencia = response.data;
            this.toastService.success('Referencia creada exitosamente');
            return ReferenciasActions.createReferenciaSuccess({ referencia });
          }),
          catchError((error) => {
            let message = 'Error al crear la referencia';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ReferenciasActions.createReferenciaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar referencia
   */
  updateReferencia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenciasActions.updateReferencia),
      switchMap(({ id, data }) =>
        this.referenciaService.update(id, data).pipe(
          map((response) => {
            const referencia = response.data;
            this.toastService.success('Referencia actualizada exitosamente');
            return ReferenciasActions.updateReferenciaSuccess({ referencia });
          }),
          catchError((error) => {
            let message = 'Error al actualizar la referencia';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ReferenciasActions.updateReferenciaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar referencia
   */
  deleteReferencia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenciasActions.deleteReferencia),
      switchMap(({ id }) =>
        this.referenciaService.deleteReferencia(id).pipe(
          map(() => {
            this.toastService.success('Referencia eliminada exitosamente');
            return ReferenciasActions.deleteReferenciaSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la referencia';
            this.toastService.error(message);
            return of(ReferenciasActions.deleteReferenciaFailure({ error: message }));
          })
        )
      )
    )
  );
}
