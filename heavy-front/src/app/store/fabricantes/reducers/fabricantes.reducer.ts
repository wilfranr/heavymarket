import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Fabricante } from '../../../core/models/fabricante.model';
import * as FabricantesActions from '../actions/fabricantes.actions';

/**
 * Estado de los fabricantes usando EntityAdapter para mejor gestión
 */
export interface FabricantesState extends EntityState<Fabricante> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Fabricante> = createEntityAdapter<Fabricante>({
    selectId: (fabricante: Fabricante) => fabricante.id,
    sortComparer: (a: Fabricante, b: Fabricante) => a.nombre.localeCompare(b.nombre)
});

const initialState: FabricantesState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const fabricantesReducer = createReducer(
    initialState,

    // Cargar fabricantes
    on(FabricantesActions.loadFabricantes, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(FabricantesActions.loadFabricantesSuccess, (state, { fabricantes, total, currentPage, lastPage }) => {
        return adapter.setAll(fabricantes, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(FabricantesActions.loadFabricantesFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar fabricante por ID
    on(FabricantesActions.loadFabricanteById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(FabricantesActions.loadFabricanteByIdSuccess, (state, { fabricante }) => {
        return adapter.upsertOne(fabricante, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(FabricantesActions.loadFabricanteByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear fabricante
    on(FabricantesActions.createFabricante, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(FabricantesActions.createFabricanteSuccess, (state, { fabricante }) => {
        return adapter.addOne(fabricante, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(FabricantesActions.createFabricanteFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar fabricante
    on(FabricantesActions.updateFabricante, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(FabricantesActions.updateFabricanteSuccess, (state, { fabricante }) => {
        return adapter.updateOne(
            { id: fabricante.id, changes: fabricante },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(FabricantesActions.updateFabricanteFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar fabricante
    on(FabricantesActions.deleteFabricante, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(FabricantesActions.deleteFabricanteSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(FabricantesActions.deleteFabricanteFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(FabricantesActions.resetFabricantesState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
