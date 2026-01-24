import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Transportadora } from '../../../core/models/transportadora.model';
import * as TransportadorasActions from '../actions/transportadoras.actions';

/**
 * Estado de las transportadoras usando EntityAdapter para mejor gestión
 */
export interface TransportadorasState extends EntityState<Transportadora> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<Transportadora> = createEntityAdapter<Transportadora>({
  selectId: (transportadora: Transportadora) => transportadora.id,
  sortComparer: (a: Transportadora, b: Transportadora) => 
    a.nombre.localeCompare(b.nombre),
});

const initialState: TransportadorasState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const transportadorasReducer = createReducer(
  initialState,

  // Cargar transportadoras
  on(TransportadorasActions.loadTransportadoras, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TransportadorasActions.loadTransportadorasSuccess, (state, { transportadoras, total, currentPage, lastPage }) => {
    return adapter.setAll(transportadoras, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(TransportadorasActions.loadTransportadorasFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar transportadora por ID
  on(TransportadorasActions.loadTransportadoraById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TransportadorasActions.loadTransportadoraByIdSuccess, (state, { transportadora }) => {
    return adapter.upsertOne(transportadora, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(TransportadorasActions.loadTransportadoraByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear transportadora
  on(TransportadorasActions.createTransportadora, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TransportadorasActions.createTransportadoraSuccess, (state, { transportadora }) => {
    return adapter.addOne(transportadora, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(TransportadorasActions.createTransportadoraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar transportadora
  on(TransportadorasActions.updateTransportadora, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TransportadorasActions.updateTransportadoraSuccess, (state, { transportadora }) => {
    return adapter.updateOne(
      { id: transportadora.id, changes: transportadora },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(TransportadorasActions.updateTransportadoraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar transportadora
  on(TransportadorasActions.deleteTransportadora, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TransportadorasActions.deleteTransportadoraSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(TransportadorasActions.deleteTransportadoraFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(TransportadorasActions.resetTransportadorasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
