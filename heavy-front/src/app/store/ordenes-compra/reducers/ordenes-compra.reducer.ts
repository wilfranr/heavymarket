import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { OrdenCompra } from '../../../core/models/orden-compra.model';
import * as OrdenesCompraActions from '../actions/ordenes-compra.actions';

/**
 * Estado de las órdenes de compra usando EntityAdapter para mejor gestión
 */
export interface OrdenesCompraState extends EntityState<OrdenCompra> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<OrdenCompra> = createEntityAdapter<OrdenCompra>({
  selectId: (ordenCompra: OrdenCompra) => ordenCompra.id,
  sortComparer: (a: OrdenCompra, b: OrdenCompra) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
});

const initialState: OrdenesCompraState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const ordenesCompraReducer = createReducer(
  initialState,

  // Cargar órdenes de compra
  on(OrdenesCompraActions.loadOrdenesCompra, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(OrdenesCompraActions.loadOrdenesCompraSuccess, (state, { ordenesCompra, total, currentPage, lastPage }) => {
    return adapter.setAll(ordenesCompra, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(OrdenesCompraActions.loadOrdenesCompraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar orden de compra por ID
  on(OrdenesCompraActions.loadOrdenCompraById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(OrdenesCompraActions.loadOrdenCompraByIdSuccess, (state, { ordenCompra }) => {
    return adapter.upsertOne(ordenCompra, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(OrdenesCompraActions.loadOrdenCompraByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear orden de compra
  on(OrdenesCompraActions.createOrdenCompra, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(OrdenesCompraActions.createOrdenCompraSuccess, (state, { ordenCompra }) => {
    return adapter.addOne(ordenCompra, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(OrdenesCompraActions.createOrdenCompraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar orden de compra
  on(OrdenesCompraActions.updateOrdenCompra, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(OrdenesCompraActions.updateOrdenCompraSuccess, (state, { ordenCompra }) => {
    return adapter.updateOne(
      { id: ordenCompra.id, changes: ordenCompra },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(OrdenesCompraActions.updateOrdenCompraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar orden de compra
  on(OrdenesCompraActions.deleteOrdenCompra, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(OrdenesCompraActions.deleteOrdenCompraSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(OrdenesCompraActions.deleteOrdenCompraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(OrdenesCompraActions.resetOrdenesCompraState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
