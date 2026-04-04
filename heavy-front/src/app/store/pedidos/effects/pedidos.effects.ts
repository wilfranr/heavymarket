import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concat, from, of, timer } from 'rxjs';
import { map, catchError, mergeMap, switchMap } from 'rxjs/operators';
import { PedidoService } from '../../../core/services/pedido.service';
import * as PedidosActions from '../actions/pedidos.actions';

/** Payload multipart de pedido con archivos de referencia (crear/actualizar). */
function pedidoPayloadHasReferenciaImagenes(payload: unknown): boolean {
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
        for (const key of payload.keys()) {
            if (key.includes('imagenes')) {
                return true;
            }
        }
    }
    return false;
}

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
                    map((response) =>
                        PedidosActions.loadPedidosSuccess({
                            pedidos: response.data,
                            total: response.meta.total,
                            page: response.meta.current_page
                        })
                    ),
                    catchError((error) =>
                        of(
                            PedidosActions.loadPedidosFailure({
                                error: error.error?.message || 'Error al cargar pedidos'
                            })
                        )
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
                    map((response) => PedidosActions.loadPedidoSuccess({ pedido: response.data })),
                    catchError((error) =>
                        of(
                            PedidosActions.loadPedidoFailure({
                                error: error.error?.message || 'Error al cargar pedido'
                            })
                        )
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
                    mergeMap((response) => {
                        const id = response.data.id;
                        const hasImages = pedidoPayloadHasReferenciaImagenes(pedido);
                        const afterSuccess = from([
                            PedidosActions.createPedidoSuccess({ pedido: response.data }),
                            PedidosActions.loadPedido({ id })
                        ]);
                        if (!hasImages) {
                            return afterSuccess;
                        }
                        return concat(
                            afterSuccess,
                            timer(2000).pipe(map(() => PedidosActions.loadPedido({ id })))
                        );
                    }),
                    catchError((error) =>
                        of(
                            PedidosActions.createPedidoFailure({
                                error: error.error?.message || 'Error al crear pedido'
                            })
                        )
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
                    mergeMap((response) => {
                        const idPedido = response.data.id;
                        const hasImages = pedidoPayloadHasReferenciaImagenes(changes);
                        const afterSuccess = from([
                            PedidosActions.updatePedidoSuccess({ pedido: response.data }),
                            PedidosActions.loadPedido({ id: idPedido })
                        ]);
                        if (!hasImages) {
                            return afterSuccess;
                        }
                        return concat(
                            afterSuccess,
                            timer(2000).pipe(map(() => PedidosActions.loadPedido({ id: idPedido })))
                        );
                    }),
                    catchError((error) =>
                        of(
                            PedidosActions.updatePedidoFailure({
                                error: error.error?.message || 'Error al actualizar pedido'
                            })
                        )
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
                    catchError((error) =>
                        of(
                            PedidosActions.deletePedidoFailure({
                                error: error.error?.message || 'Error al eliminar pedido'
                            })
                        )
                    )
                )
            )
        )
    );
}
