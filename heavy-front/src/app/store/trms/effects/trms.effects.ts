import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TRMService } from '../../../core/services/trm.service';
import { MessageService } from 'primeng/api';
import * as TRMsActions from '../actions/trms.actions';

/**
 * Effects para el módulo de TRM
 */
@Injectable()
export class TRMsEffects {
  private actions$ = inject(Actions);
  private trmService = inject(TRMService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar TRMs
   */
  loadTRMs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.loadTRMs),
      switchMap(({ page, per_page }) =>
        this.trmService.getAll({ page, per_page }).pipe(
          map((response) => {
            return TRMsActions.loadTRMsSuccess({
              trms: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las TRM';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.loadTRMsFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar TRM más reciente
   */
  loadLatestTRM$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.loadLatestTRM),
      switchMap(() =>
        this.trmService.getLatest().pipe(
          map((response) => {
            return TRMsActions.loadLatestTRMSuccess({
              trm: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la TRM más reciente';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.loadLatestTRMFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar TRM por ID
   */
  loadTRMById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.loadTRMById),
      switchMap(({ id }) =>
        this.trmService.getById(id).pipe(
          map((response) => {
            return TRMsActions.loadTRMByIdSuccess({
              trm: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la TRM';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.loadTRMByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear TRM
   */
  createTRM$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.createTRM),
      switchMap(({ data }) =>
        this.trmService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'TRM creada exitosamente',
            });
            return TRMsActions.createTRMSuccess({
              trm: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear la TRM';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.createTRMFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar TRM
   */
  updateTRM$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.updateTRM),
      switchMap(({ id, data }) =>
        this.trmService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'TRM actualizada exitosamente',
            });
            return TRMsActions.updateTRMSuccess({
              trm: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar la TRM';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.updateTRMFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar TRM
   */
  deleteTRM$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TRMsActions.deleteTRM),
      switchMap(({ id }) =>
        this.trmService.deleteTRM(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'TRM eliminada exitosamente',
            });
            return TRMsActions.deleteTRMSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la TRM';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(TRMsActions.deleteTRMFailure({ error: message }));
          })
        )
      )
    )
  );
}
