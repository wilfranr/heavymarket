import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { MessageService } from 'primeng/api';
import * as OrdenesCompraActions from '../actions/ordenes-compra.actions';

/**
 * Effects para el módulo de Órdenes de Compra
 */
@Injectable()
export class OrdenesCompraEffects {
  private actions$ = inject(Actions);
  private ordenCompraService = inject(OrdenCompraService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar órdenes de compra
   */
  loadOrdenesCompra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesCompraActions.loadOrdenesCompra),
      switchMap(({ estado, proveedor_id, tercero_id, pedido_id, color, page, per_page }) =>
        this.ordenCompraService.getAll({ estado, proveedor_id, tercero_id, pedido_id, color, page, per_page }).pipe(
          map((response) => {
            return OrdenesCompraActions.loadOrdenesCompraSuccess({
              ordenesCompra: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las órdenes de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesCompraActions.loadOrdenesCompraFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar orden de compra por ID
   */
  loadOrdenCompraById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesCompraActions.loadOrdenCompraById),
      switchMap(({ id }) =>
        this.ordenCompraService.getById(id).pipe(
          map((response) => {
            return OrdenesCompraActions.loadOrdenCompraByIdSuccess({
              ordenCompra: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la orden de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesCompraActions.loadOrdenCompraByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear orden de compra
   */
  createOrdenCompra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesCompraActions.createOrdenCompra),
      switchMap(({ data }) =>
        this.ordenCompraService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de compra creada exitosamente',
            });
            return OrdenesCompraActions.createOrdenCompraSuccess({
              ordenCompra: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear la orden de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesCompraActions.createOrdenCompraFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar orden de compra
   */
  updateOrdenCompra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesCompraActions.updateOrdenCompra),
      switchMap(({ id, data }) =>
        this.ordenCompraService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de compra actualizada exitosamente',
            });
            return OrdenesCompraActions.updateOrdenCompraSuccess({
              ordenCompra: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar la orden de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesCompraActions.updateOrdenCompraFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar orden de compra
   */
  deleteOrdenCompra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdenesCompraActions.deleteOrdenCompra),
      switchMap(({ id }) =>
        this.ordenCompraService.deleteOrdenCompra(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Orden de compra eliminada exitosamente',
            });
            return OrdenesCompraActions.deleteOrdenCompraSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la orden de compra';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(OrdenesCompraActions.deleteOrdenCompraFailure({ error: message }));
          })
        )
      )
    )
  );
}
