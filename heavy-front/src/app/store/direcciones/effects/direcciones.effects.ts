import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DireccionService } from '../../../core/services/direccion.service';
import { MessageService } from 'primeng/api';
import * as DireccionesActions from '../actions/direcciones.actions';

/**
 * Effects para el módulo de Direcciones
 */
@Injectable()
export class DireccionesEffects {
  private actions$ = inject(Actions);
  private direccionService = inject(DireccionService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar direcciones
   */
  loadDirecciones$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DireccionesActions.loadDirecciones),
      switchMap(({ page, per_page, search, tercero_id }) =>
        this.direccionService.getAll({ page, per_page, search, tercero_id }).pipe(
          map((response) => {
            return DireccionesActions.loadDireccionesSuccess({
              direcciones: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las direcciones';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(DireccionesActions.loadDireccionesFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar dirección por ID
   */
  loadDireccionById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DireccionesActions.loadDireccionById),
      switchMap(({ id }) =>
        this.direccionService.getById(id).pipe(
          map((response) => {
            return DireccionesActions.loadDireccionByIdSuccess({
              direccion: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la dirección';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(DireccionesActions.loadDireccionByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear dirección
   */
  createDireccion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DireccionesActions.createDireccion),
      switchMap(({ data }) =>
        this.direccionService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Dirección creada exitosamente',
            });
            return DireccionesActions.createDireccionSuccess({
              direccion: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear la dirección';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(DireccionesActions.createDireccionFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar dirección
   */
  updateDireccion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DireccionesActions.updateDireccion),
      switchMap(({ id, data }) =>
        this.direccionService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Dirección actualizada exitosamente',
            });
            return DireccionesActions.updateDireccionSuccess({
              direccion: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar la dirección';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(DireccionesActions.updateDireccionFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar dirección
   */
  deleteDireccion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DireccionesActions.deleteDireccion),
      switchMap(({ id }) =>
        this.direccionService.deleteDireccion(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Dirección eliminada exitosamente',
            });
            return DireccionesActions.deleteDireccionSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la dirección';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(DireccionesActions.deleteDireccionFailure({ error: message }));
          })
        )
      )
    )
  );
}
