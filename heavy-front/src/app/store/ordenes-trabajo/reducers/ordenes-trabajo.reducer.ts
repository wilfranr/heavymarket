import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { OrdenTrabajo } from '../../../core/models/orden-trabajo.model';
import * as OrdenesTrabajoActions from '../actions/ordenes-trabajo.actions';

/**
 * Estado de las órdenes de trabajo usando EntityAdapter para mejor gestión
 */
export interface OrdenesTrabajoState extends EntityState<OrdenTrabajo> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<OrdenTrabajo> = createEntityAdapter<OrdenTrabajo>({
    selectId: (ordenTrabajo: OrdenTrabajo) => ordenTrabajo.id,
    sortComparer: (a: OrdenTrabajo, b: OrdenTrabajo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
});

const initialState: OrdenesTrabajoState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const ordenesTrabajoReducer = createReducer(
    initialState,

    // Cargar órdenes de trabajo
    on(OrdenesTrabajoActions.loadOrdenesTrabajo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(OrdenesTrabajoActions.loadOrdenesTrabajoSuccess, (state, { ordenesTrabajo, total, currentPage, lastPage }) => {
        return adapter.setAll(ordenesTrabajo, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(OrdenesTrabajoActions.loadOrdenesTrabajoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar orden de trabajo por ID
    on(OrdenesTrabajoActions.loadOrdenTrabajoById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(OrdenesTrabajoActions.loadOrdenTrabajoByIdSuccess, (state, { ordenTrabajo }) => {
        return adapter.upsertOne(ordenTrabajo, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(OrdenesTrabajoActions.loadOrdenTrabajoByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear orden de trabajo
    on(OrdenesTrabajoActions.createOrdenTrabajo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(OrdenesTrabajoActions.createOrdenTrabajoSuccess, (state, { ordenTrabajo }) => {
        return adapter.addOne(ordenTrabajo, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(OrdenesTrabajoActions.createOrdenTrabajoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar orden de trabajo
    on(OrdenesTrabajoActions.updateOrdenTrabajo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(OrdenesTrabajoActions.updateOrdenTrabajoSuccess, (state, { ordenTrabajo }) => {
        return adapter.updateOne(
            { id: ordenTrabajo.id, changes: ordenTrabajo },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(OrdenesTrabajoActions.updateOrdenTrabajoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar orden de trabajo
    on(OrdenesTrabajoActions.deleteOrdenTrabajo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(OrdenesTrabajoActions.deleteOrdenTrabajoSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(OrdenesTrabajoActions.deleteOrdenTrabajoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(OrdenesTrabajoActions.resetOrdenesTrabajoState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
