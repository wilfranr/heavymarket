import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Sistema } from '../../../core/models/sistema.model';
import * as SistemasActions from '../actions/sistemas.actions';

/**
 * Estado de los sistemas usando EntityAdapter para mejor gestión
 */
export interface SistemasState extends EntityState<Sistema> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Sistema> = createEntityAdapter<Sistema>({
    selectId: (sistema: Sistema) => sistema.id,
    sortComparer: (a: Sistema, b: Sistema) => a.nombre.localeCompare(b.nombre)
});

const initialState: SistemasState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const sistemasReducer = createReducer(
    initialState,

    // Cargar sistemas
    on(SistemasActions.loadSistemas, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(SistemasActions.loadSistemasSuccess, (state, { sistemas, total, currentPage, lastPage }) => {
        return adapter.setAll(sistemas, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(SistemasActions.loadSistemasFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar sistema por ID
    on(SistemasActions.loadSistemaById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(SistemasActions.loadSistemaByIdSuccess, (state, { sistema }) => {
        return adapter.upsertOne(sistema, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(SistemasActions.loadSistemaByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear sistema
    on(SistemasActions.createSistema, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(SistemasActions.createSistemaSuccess, (state, { sistema }) => {
        return adapter.addOne(sistema, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(SistemasActions.createSistemaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar sistema
    on(SistemasActions.updateSistema, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(SistemasActions.updateSistemaSuccess, (state, { sistema }) => {
        return adapter.updateOne(
            { id: sistema.id, changes: sistema },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(SistemasActions.updateSistemaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar sistema
    on(SistemasActions.deleteSistema, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(SistemasActions.deleteSistemaSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(SistemasActions.deleteSistemaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(SistemasActions.resetSistemasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
