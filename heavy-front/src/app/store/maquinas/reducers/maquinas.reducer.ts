import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Maquina } from '../../../core/models/maquina.model';
import * as MaquinasActions from '../actions/maquinas.actions';

/**
 * Estado de las máquinas usando EntityAdapter para mejor gestión
 */
export interface MaquinasState extends EntityState<Maquina> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Maquina> = createEntityAdapter<Maquina>({
    selectId: (maquina: Maquina) => maquina.id,
    sortComparer: (a: Maquina, b: Maquina) => a.modelo.localeCompare(b.modelo)
});

const initialState: MaquinasState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const maquinasReducer = createReducer(
    initialState,

    // Cargar máquinas
    on(MaquinasActions.loadMaquinas, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(MaquinasActions.loadMaquinasSuccess, (state, { maquinas, total, currentPage, lastPage }) => {
        return adapter.setAll(maquinas, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(MaquinasActions.loadMaquinasFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar máquina por ID
    on(MaquinasActions.loadMaquinaById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(MaquinasActions.loadMaquinaByIdSuccess, (state, { maquina }) => {
        return adapter.upsertOne(maquina, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(MaquinasActions.loadMaquinaByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear máquina
    on(MaquinasActions.createMaquina, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(MaquinasActions.createMaquinaSuccess, (state, { maquina }) => {
        return adapter.addOne(maquina, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(MaquinasActions.createMaquinaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar máquina
    on(MaquinasActions.updateMaquina, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(MaquinasActions.updateMaquinaSuccess, (state, { maquina }) => {
        return adapter.updateOne(
            { id: maquina.id, changes: maquina },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(MaquinasActions.updateMaquinaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar máquina
    on(MaquinasActions.deleteMaquina, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(MaquinasActions.deleteMaquinaSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(MaquinasActions.deleteMaquinaFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(MaquinasActions.resetMaquinasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
