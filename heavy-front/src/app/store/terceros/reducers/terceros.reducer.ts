import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Tercero } from '../../../core/models/tercero.model';
import * as TercerosActions from '../actions/terceros.actions';

/**
 * Estado de Terceros usando Entity Adapter
 */
export interface TercerosState extends EntityState<Tercero> {
    loading: boolean;
    error: any;
}

/**
 * Adapter para manejar la colección de terceros
 */
export const tercerosAdapter: EntityAdapter<Tercero> = createEntityAdapter<Tercero>({
    selectId: (tercero: Tercero) => tercero.id,
    sortComparer: false
});

/**
 * Estado inicial
 */
export const initialState: TercerosState = tercerosAdapter.getInitialState({
    loading: false,
    error: null
});

/**
 * Reducer de Terceros
 */
export const tercerosReducer = createReducer(
    initialState,

    // Load Terceros
    on(TercerosActions.loadTerceros, (state) => ({
        ...state,
        loading: true,
        error: null
    })),
    on(TercerosActions.loadTercerosSuccess, (state, { terceros }) =>
        tercerosAdapter.setAll(terceros, { ...state, loading: false })
    ),
    on(TercerosActions.loadTercerosFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Create Tercero
    on(TercerosActions.createTercero, (state) => ({
        ...state,
        loading: true
    })),
    on(TercerosActions.createTerceroSuccess, (state, { tercero }) =>
        tercerosAdapter.addOne(tercero, { ...state, loading: false })
    ),
    on(TercerosActions.createTerceroFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Update Tercero
    on(TercerosActions.updateTercero, (state) => ({
        ...state,
        loading: true
    })),
    on(TercerosActions.updateTerceroSuccess, (state, { tercero }) =>
        tercerosAdapter.updateOne(
            { id: tercero.id, changes: tercero },
            { ...state, loading: false }
        )
    ),
    on(TercerosActions.updateTerceroFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Delete Tercero
    on(TercerosActions.deleteTercero, (state) => ({
        ...state,
        loading: true
    })),
    on(TercerosActions.deleteTerceroSuccess, (state, { id }) =>
        tercerosAdapter.removeOne(id, { ...state, loading: false })
    ),
    on(TercerosActions.deleteTerceroFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    }))
);
