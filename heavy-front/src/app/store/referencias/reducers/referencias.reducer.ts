import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Referencia } from '../../../core/models/referencia.model';
import * as ReferenciasActions from '../actions/referencias.actions';

/**
 * Estado de las referencias usando EntityAdapter para mejor gestión
 */
export interface ReferenciasState extends EntityState<Referencia> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Referencia> = createEntityAdapter<Referencia>({
    selectId: (referencia: Referencia) => referencia.id,
    sortComparer: (a: Referencia, b: Referencia) => a.referencia.localeCompare(b.referencia)
});

const initialState: ReferenciasState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const referenciasReducer = createReducer(
    initialState,

    // Cargar referencias
    on(ReferenciasActions.loadReferencias, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ReferenciasActions.loadReferenciasSuccess, (state, { referencias, total, currentPage, lastPage }) => {
        return adapter.setAll(referencias, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(ReferenciasActions.loadReferenciasFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar referencia por ID
    on(ReferenciasActions.loadReferenciaById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ReferenciasActions.loadReferenciaByIdSuccess, (state, { referencia }) => {
        return adapter.upsertOne(referencia, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ReferenciasActions.loadReferenciaByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear referencia
    on(ReferenciasActions.createReferencia, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ReferenciasActions.createReferenciaSuccess, (state, { referencia }) => {
        return adapter.addOne(referencia, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ReferenciasActions.createReferenciaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar referencia
    on(ReferenciasActions.updateReferencia, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ReferenciasActions.updateReferenciaSuccess, (state, { referencia }) => {
        return adapter.updateOne(
            { id: referencia.id, changes: referencia },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(ReferenciasActions.updateReferenciaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar referencia
    on(ReferenciasActions.deleteReferencia, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ReferenciasActions.deleteReferenciaSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ReferenciasActions.deleteReferenciaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(ReferenciasActions.resetReferenciasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
