import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { PedidoService } from '../../../core/services/pedido.service';
import * as PedidosActions from '../actions/pedidos.actions';

/**
 * Effects de Pedidos
 * 
 * Maneja las operaciones asíncronas relacionadas con pedidos
 */
@Injectable()
export class PedidosEffects {
  private actions$ = inject(Actions);
  private pedidoService = inject(PedidoService);

  /**
   * Effect: Load Pedidos List
   */
  loadPedidos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PedidosActions.loadPedidos),
      switchMap(({ params }) =>
        this.pedidoService.list(params).pipe(
          map(response =>
            PedidosActions.loadPedidosSuccess({
              pedidos: response.data,
              total: response.meta.total,
              page: response.meta.current_page
            })
          ),
          catchError(error =>
            of(PedidosActions.loadPedidosFailure({
              error: error.error?.message || 'Error al cargar pedidos'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Load Single Pedido
   */
  loadPedido$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PedidosActions.loadPedido),
      switchMap(({ id }) =>
        this.pedidoService.getById(id).pipe(
          map(response =>
            PedidosActions.loadPedidoSuccess({ pedido: response.data })
          ),
          catchError(error =>
            of(PedidosActions.loadPedidoFailure({
              error: error.error?.message || 'Error al cargar pedido'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Create Pedido
   */
  createPedido$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PedidosActions.createPedido),
      switchMap(({ pedido }) =>
        this.pedidoService.create(pedido).pipe(
          map(response =>
            PedidosActions.createPedidoSuccess({ pedido: response.data })
          ),
          catchError(error =>
            of(PedidosActions.createPedidoFailure({
              error: error.error?.message || 'Error al crear pedido'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Update Pedido
   */
  updatePedido$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PedidosActions.updatePedido),
      switchMap(({ id, changes }) =>
        this.pedidoService.update(id, changes).pipe(
          map(response =>
            PedidosActions.updatePedidoSuccess({ pedido: response.data })
          ),
          catchError(error =>
            of(PedidosActions.updatePedidoFailure({
              error: error.error?.message || 'Error al actualizar pedido'
            }))
          )
        )
      )
    )
  );

  /**
   * Effect: Delete Pedido
   */
    deletePedido$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PedidosActions.deletePedido),
            switchMap(({ id }) =>
                this.pedidoService.deletePedido(id).pipe(
          map(() => PedidosActions.deletePedidoSuccess({ id })),
          catchError(error =>
            of(PedidosActions.deletePedidoFailure({
              error: error.error?.message || 'Error al eliminar pedido'
            }))
          )
        )
      )
    )
  );
}
