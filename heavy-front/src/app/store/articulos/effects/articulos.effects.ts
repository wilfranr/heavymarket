import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ToastService } from '../../../core/services/toast.service';
import * as ArticulosActions from '../actions/articulos.actions';

/**
 * Effects para el módulo de Artículos
 */
@Injectable()
export class ArticulosEffects {
  private actions$ = inject(Actions);
  private articuloService = inject(ArticuloService);
  private toastService = inject(ToastService);

  /**
   * Effect para cargar artículos
   */
  loadArticulos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ArticulosActions.loadArticulos),
      switchMap(({ search, page, per_page }) =>
        this.articuloService.getAll({ search, page, per_page }).pipe(
          map((response) => {
            return ArticulosActions.loadArticulosSuccess({
              articulos: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar los artículos';
            this.toastService.error(message);
            return of(ArticulosActions.loadArticulosFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar artículo por ID
   */
  loadArticuloById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ArticulosActions.loadArticuloById),
      switchMap(({ id }) =>
        this.articuloService.getById(id).pipe(
          map((response) => {
            const articulo = response.data;
            return ArticulosActions.loadArticuloByIdSuccess({ articulo });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar el artículo';
            this.toastService.error(message);
            return of(ArticulosActions.loadArticuloByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear artículo
   */
  createArticulo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ArticulosActions.createArticulo),
      switchMap(({ data }) =>
        this.articuloService.create(data).pipe(
          map((response) => {
            const articulo = response.data;
            this.toastService.success('Artículo creado exitosamente');
            return ArticulosActions.createArticuloSuccess({ articulo });
          }),
          catchError((error) => {
            let message = 'Error al crear el artículo';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ArticulosActions.createArticuloFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar artículo
   */
  updateArticulo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ArticulosActions.updateArticulo),
      switchMap(({ id, data }) =>
        this.articuloService.update(id, data).pipe(
          map((response) => {
            const articulo = response.data;
            this.toastService.success('Artículo actualizado exitosamente');
            return ArticulosActions.updateArticuloSuccess({ articulo });
          }),
          catchError((error) => {
            let message = 'Error al actualizar el artículo';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ArticulosActions.updateArticuloFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar artículo
   */
  deleteArticulo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ArticulosActions.deleteArticulo),
      switchMap(({ id }) =>
        this.articuloService.deleteArticulo(id).pipe(
          map(() => {
            this.toastService.success('Artículo eliminado exitosamente');
            return ArticulosActions.deleteArticuloSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar el artículo';
            this.toastService.error(message);
            return of(ArticulosActions.deleteArticuloFailure({ error: message }));
          })
        )
      )
    )
  );
}
