import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Lista } from '../../../core/models/lista.model';
import * as ListasActions from '../actions/listas.actions';

/**
 * Estado de las listas usando EntityAdapter para mejor gestión
 */
export interface ListasState extends EntityState<Lista> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
    listasByTipo: { [key: string]: Lista[] };
}

export const adapter: EntityAdapter<Lista> = createEntityAdapter<Lista>({
    selectId: (lista: Lista) => lista.id,
    sortComparer: (a: Lista, b: Lista) => a.nombre.localeCompare(b.nombre)
});

const initialState: ListasState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1,
    listasByTipo: {}
});

export const listasReducer = createReducer(
    initialState,

    // Cargar listas
    on(ListasActions.loadListas, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.loadListasSuccess, (state, { listas, total, currentPage, lastPage }) => {
        return adapter.setAll(listas, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(ListasActions.loadListasFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar lista por ID
    on(ListasActions.loadListaById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.loadListaByIdSuccess, (state, { lista }) => {
        return adapter.upsertOne(lista, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ListasActions.loadListaByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar listas por tipo
    on(ListasActions.loadListasByTipo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.loadListasByTipoSuccess, (state, { tipo, listas }) => {
        return {
            ...state,
            loading: false,
            error: null,
            listasByTipo: {
                ...state.listasByTipo,
                [tipo]: listas
            }
        };
    }),

    on(ListasActions.loadListasByTipoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear lista
    on(ListasActions.createLista, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.createListaSuccess, (state, { lista }) => {
        return adapter.addOne(lista, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ListasActions.createListaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar lista
    on(ListasActions.updateLista, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.updateListaSuccess, (state, { lista }) => {
        return adapter.updateOne(
            { id: lista.id, changes: lista },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(ListasActions.updateListaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar lista
    on(ListasActions.deleteLista, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ListasActions.deleteListaSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ListasActions.deleteListaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(ListasActions.resetListasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
