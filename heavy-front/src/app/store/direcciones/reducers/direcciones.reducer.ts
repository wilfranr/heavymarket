import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Direccion } from '../../../core/models/direccion.model';
import * as DireccionesActions from '../actions/direcciones.actions';

/**
 * Estado de las direcciones usando EntityAdapter para mejor gestión
 */
export interface DireccionesState extends EntityState<Direccion> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Direccion> = createEntityAdapter<Direccion>({
    selectId: (direccion: Direccion) => direccion.id,
    sortComparer: (a: Direccion, b: Direccion) => a.direccion.localeCompare(b.direccion)
});

const initialState: DireccionesState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const direccionesReducer = createReducer(
    initialState,

    // Cargar direcciones
    on(DireccionesActions.loadDirecciones, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(DireccionesActions.loadDireccionesSuccess, (state, { direcciones, total, currentPage, lastPage }) => {
        return adapter.setAll(direcciones, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(DireccionesActions.loadDireccionesFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar dirección por ID
    on(DireccionesActions.loadDireccionById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(DireccionesActions.loadDireccionByIdSuccess, (state, { direccion }) => {
        return adapter.upsertOne(direccion, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(DireccionesActions.loadDireccionByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear dirección
    on(DireccionesActions.createDireccion, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(DireccionesActions.createDireccionSuccess, (state, { direccion }) => {
        return adapter.addOne(direccion, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(DireccionesActions.createDireccionFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar dirección
    on(DireccionesActions.updateDireccion, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(DireccionesActions.updateDireccionSuccess, (state, { direccion }) => {
        return adapter.updateOne(
            { id: direccion.id, changes: direccion },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(DireccionesActions.updateDireccionFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar dirección
    on(DireccionesActions.deleteDireccion, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(DireccionesActions.deleteDireccionSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(DireccionesActions.deleteDireccionFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(DireccionesActions.resetDireccionesState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
