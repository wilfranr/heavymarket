import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { OrdenTrabajoService } from '../../../core/services/orden-trabajo.service';
import { MessageService } from 'primeng/api';
import * as OrdenesTrabajoActions from '../actions/ordenes-trabajo.actions';

/**
 * Effects para el módulo de Órdenes de Trabajo
 */
@Injectable()
export class OrdenesTrabajoEffects {
  private actions$ = inject(Actions);
  private ordenTrabajoService = inject(OrdenTrabajoService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar órdenes de trabajo
   */
  loadOrdenesTrabajo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesTrabajoActions.loadOrdenesTrabajo),
      switchMap(({ estado, tercero_id, pedido_id, transportadora_id, page, per_page }) =>
        this.ordenTrabajoService.getAll({ estado, tercero_id, pedido_id, transportadora_id, page, per_page }).pipe(
          map((response) => {
            return OrdenesTrabajoActions.loadOrdenesTrabajoSuccess({
              ordenesTrabajo: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las órdenes de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesTrabajoActions.loadOrdenesTrabajoFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar orden de trabajo por ID
   */
  loadOrdenTrabajoById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesTrabajoActions.loadOrdenTrabajoById),
      switchMap(({ id }) =>
        this.ordenTrabajoService.getById(id).pipe(
          map((response) => {
            return OrdenesTrabajoActions.loadOrdenTrabajoByIdSuccess({
              ordenTrabajo: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la orden de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesTrabajoActions.loadOrdenTrabajoByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear orden de trabajo
   */
  createOrdenTrabajo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesTrabajoActions.createOrdenTrabajo),
      switchMap(({ data }) =>
        this.ordenTrabajoService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de trabajo creada exitosamente',
            });
            return OrdenesTrabajoActions.createOrdenTrabajoSuccess({
              ordenTrabajo: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear la orden de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesTrabajoActions.createOrdenTrabajoFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar orden de trabajo
   */
  updateOrdenTrabajo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesTrabajoActions.updateOrdenTrabajo),
      switchMap(({ id, data }) =>
        this.ordenTrabajoService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de trabajo actualizada exitosamente',
            });
            return OrdenesTrabajoActions.updateOrdenTrabajoSuccess({
              ordenTrabajo: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar la orden de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesTrabajoActions.updateOrdenTrabajoFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar orden de trabajo
   */
  deleteOrdenTrabajo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesTrabajoActions.deleteOrdenTrabajo),
      switchMap(({ id }) =>
        this.ordenTrabajoService.deleteOrdenTrabajo(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de trabajo eliminada exitosamente',
            });
            return OrdenesTrabajoActions.deleteOrdenTrabajoSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la orden de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesTrabajoActions.deleteOrdenTrabajoFailure({ error: message }));
          })
        )
      )
    )
  );
}
