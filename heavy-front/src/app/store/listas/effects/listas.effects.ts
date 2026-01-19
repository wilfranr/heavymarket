import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { ListaService } from '../../../core/services/lista.service';
import { ToastService } from '../../../core/services/toast.service';
import * as ListasActions from '../actions/listas.actions';
import { selectListasByTipo } from '../selectors/listas.selectors';
import { ListaTipo } from '../../../core/models/lista.model';

/**
 * Effects para el módulo de Listas
 */
@Injectable()
export class ListasEffects {
  private actions$ = inject(Actions);
  private listaService = inject(ListaService);
  private toastService = inject(ToastService);
  private store = inject(Store);

  /**
   * Effect para cargar listas
   */
  loadListas$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.loadListas),
      switchMap(({ tipo, search, page, per_page }) =>
        this.listaService.getAll({ tipo, search, page, per_page }).pipe(
          map((response) => {
            return ListasActions.loadListasSuccess({
              listas: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las listas';
            this.toastService.error(message);
            return of(ListasActions.loadListasFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar lista por ID
   */
  loadListaById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.loadListaById),
      switchMap(({ id }) =>
        this.listaService.getById(id).pipe(
          map((response) => {
            const lista = response.data;
            return ListasActions.loadListaByIdSuccess({ lista });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la lista';
            this.toastService.error(message);
            return of(ListasActions.loadListaByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar listas por tipo
   */
  loadListasByTipo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.loadListasByTipo),
      switchMap(({ tipo }) => {
        // Verificar cache primero
        const cachedListas$ = this.store.select(selectListasByTipo(tipo));
        
        return cachedListas$.pipe(
          switchMap((cachedListas) => {
            // Si ya están en cache, no hacer la llamada
            if (cachedListas && cachedListas.length > 0) {
              return of(ListasActions.loadListasByTipoSuccess({ tipo, listas: cachedListas }));
            }

            return this.listaService.getByTipo(tipo).pipe(
              map((listas) => {
                return ListasActions.loadListasByTipoSuccess({ tipo, listas });
              }),
              catchError((error) => {
                const message = error.error?.message || `Error al cargar listas de tipo ${tipo}`;
                this.toastService.error(message);
                return of(ListasActions.loadListasByTipoFailure({ error: message }));
              })
            );
          }),
          // Tomar solo el primer valor para evitar múltiples llamadas
          take(1)
        );
      })
    )
  );

  /**
   * Effect para crear lista
   */
  createLista$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.createLista),
      switchMap(({ data }) =>
        this.listaService.create(data).pipe(
          map((response) => {
            const lista = response.data;
            this.toastService.success('Lista creada exitosamente');
            return ListasActions.createListaSuccess({ lista });
          }),
          catchError((error) => {
            let message = 'Error al crear la lista';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ListasActions.createListaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar lista
   */
  updateLista$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.updateLista),
      switchMap(({ id, data }) =>
        this.listaService.update(id, data).pipe(
          map((response) => {
            const lista = response.data;
            this.toastService.success('Lista actualizada exitosamente');
            return ListasActions.updateListaSuccess({ lista });
          }),
          catchError((error) => {
            let message = 'Error al actualizar la lista';
            
            if (error.status === 422 && error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0] as string[];
              message = firstError[0] || message;
            } else if (error.error?.message) {
              message = error.error.message;
            }
            
            this.toastService.error(message);
            return of(ListasActions.updateListaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar lista
   */
  deleteLista$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListasActions.deleteLista),
      switchMap(({ id }) =>
        this.listaService.deleteLista(id).pipe(
          map(() => {
            this.toastService.success('Lista eliminada exitosamente');
            return ListasActions.deleteListaSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la lista';
            this.toastService.error(message);
            return of(ListasActions.deleteListaFailure({ error: message }));
          })
        )
      )
    )
  );
}
