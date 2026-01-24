import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TRM } from '../../../core/models/trm.model';
import * as TRMsActions from '../actions/trms.actions';

/**
 * Estado de las TRM usando EntityAdapter para mejor gestión
 */
export interface TRMsState extends EntityState<TRM> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
  latestTRM: TRM | null;
}

export const adapter: EntityAdapter<TRM> = createEntityAdapter<TRM>({
  selectId: (trm: TRM) => trm.id,
  sortComparer: (a: TRM, b: TRM) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
});

const initialState: TRMsState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
  latestTRM: null,
});

export const trmsReducer = createReducer(
  initialState,

  // Cargar TRMs
  on(TRMsActions.loadTRMs, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.loadTRMsSuccess, (state, { trms, total, currentPage, lastPage }) => {
    return adapter.setAll(trms, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(TRMsActions.loadTRMsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar TRM más reciente
  on(TRMsActions.loadLatestTRM, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.loadLatestTRMSuccess, (state, { trm }) => {
    return adapter.upsertOne(trm, {
      ...state,
      loading: false,
      error: null,
      latestTRM: trm,
    });
  }),

  on(TRMsActions.loadLatestTRMFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar TRM por ID
  on(TRMsActions.loadTRMById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.loadTRMByIdSuccess, (state, { trm }) => {
    return adapter.upsertOne(trm, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(TRMsActions.loadTRMByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear TRM
  on(TRMsActions.createTRM, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.createTRMSuccess, (state, { trm }) => {
    return adapter.addOne(trm, {
      ...state,
      loading: false,
      error: null,
      latestTRM: trm,
    });
  }),

  on(TRMsActions.createTRMFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar TRM
  on(TRMsActions.updateTRM, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.updateTRMSuccess, (state, { trm }) => {
    return adapter.updateOne(
      { id: trm.id, changes: trm },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(TRMsActions.updateTRMFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar TRM
  on(TRMsActions.deleteTRM, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TRMsActions.deleteTRMSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(TRMsActions.deleteTRMFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(TRMsActions.resetTRMsState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
