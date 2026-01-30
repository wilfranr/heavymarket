import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TerceroService } from '../../../core/services/tercero.service';
import * as TercerosActions from '../actions/terceros.actions';

/**
 * Effects para Terceros
 * Maneja las operaciones asíncronas
 */
@Injectable()
export class TercerosEffects {
    private readonly actions$ = inject(Actions);
    private readonly terceroService = inject(TerceroService);

    /**
     * Effect para cargar terceros
     */
    loadTerceros$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TercerosActions.loadTerceros),
            switchMap(({ params }) =>
                this.terceroService.list(params).pipe(
                    map((response) => TercerosActions.loadTercerosSuccess({ terceros: response.data })),
                    catchError((error) => of(TercerosActions.loadTercerosFailure({ error })))
                )
            )
        )
    );

    /**
     * Effect para crear tercero
     */
    createTercero$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TercerosActions.createTercero),
            switchMap(({ tercero }) =>
                this.terceroService.create(tercero).pipe(
                    map((response) => TercerosActions.createTerceroSuccess({ tercero: response.data })),
                    catchError((error) => of(TercerosActions.createTerceroFailure({ error })))
                )
            )
        )
    );

    /**
     * Effect para actualizar tercero
     */
    updateTercero$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TercerosActions.updateTercero),
            switchMap(({ id, tercero }) =>
                this.terceroService.update(id, tercero).pipe(
                    map((response) => TercerosActions.updateTerceroSuccess({ tercero: response.data })),
                    catchError((error) => of(TercerosActions.updateTerceroFailure({ error })))
                )
            )
        )
    );

    /**
     * Effect para eliminar tercero
     */
    deleteTercero$ = createEffect(() =>
        this.actions$.pipe(
            ofType(TercerosActions.deleteTercero),
            switchMap(({ id }) =>
                this.terceroService.deleteTercero(id).pipe(
                    map(() => TercerosActions.deleteTerceroSuccess({ id })),
                    catchError((error) => of(TercerosActions.deleteTerceroFailure({ error })))
                )
            )
        )
    );
}
