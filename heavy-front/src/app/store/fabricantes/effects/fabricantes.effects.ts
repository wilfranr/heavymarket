import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { ToastService } from '../../../core/services/toast.service';
import * as FabricantesActions from '../actions/fabricantes.actions';

/**
 * Effects para el módulo de Fabricantes
 */
@Injectable()
export class FabricantesEffects {
  private actions$ = inject(Actions);
  private fabricanteService = inject(FabricanteService);
  private toastService = inject(ToastService);

  /**
   * Effect para cargar fabricantes
   */
  loadFabricantes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FabricantesActions.loadFabricantes),
      switchMap(({ search, page, per_page }) =>
        this.fabricanteService.getAll({ search, page, per_page }).pipe(
          map((response) => {
            return FabricantesActions.loadFabricantesSuccess({
              fabricantes: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar los fabricantes';
            this.toastService.error(message);
            return of(FabricantesActions.loadFabricantesFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar fabricante por ID
   */
  loadFabricanteById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FabricantesActions.loadFabricanteById),
      switchMap(({ id }) =>
        this.fabricanteService.getById(id).pipe(
          map((response) => {
            const fabricante = response.data;
            return FabricantesActions.loadFabricanteByIdSuccess({ fabricante });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar el fabricante';
            this.toastService.error(message);
            return of(FabricantesActions.loadFabricanteByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear fabricante
   */
  createFabricante$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FabricantesActions.createFabricante),
      switchMap(({ data }) =>
        this.fabricanteService.create(data).pipe(
          map((response) => {
            const fabricante = response.data;
            this.toastService.success('Fabricante creado exitosamente');
            return FabricantesActions.createFabricanteSuccess({ fabricante });
          }),
          catchError((error) => {
            let message = 'Error al crear el fabricante';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(FabricantesActions.createFabricanteFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar fabricante
   */
  updateFabricante$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FabricantesActions.updateFabricante),
      switchMap(({ id, data }) =>
        this.fabricanteService.update(id, data).pipe(
          map((response) => {
            const fabricante = response.data;
            this.toastService.success('Fabricante actualizado exitosamente');
            return FabricantesActions.updateFabricanteSuccess({ fabricante });
          }),
          catchError((error) => {
            let message = 'Error al actualizar el fabricante';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(FabricantesActions.updateFabricanteFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar fabricante
   */
  deleteFabricante$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FabricantesActions.deleteFabricante),
      switchMap(({ id }) =>
        this.fabricanteService.deleteFabricante(id).pipe(
          map(() => {
            this.toastService.success('Fabricante eliminado exitosamente');
            return FabricantesActions.deleteFabricanteSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar el fabricante';
            this.toastService.error(message);
            return of(FabricantesActions.deleteFabricanteFailure({ error: message }));
          })
        )
      )
    )
  );
}
