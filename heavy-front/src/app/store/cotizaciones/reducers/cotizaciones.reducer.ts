import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import * as CotizacionesActions from '../actions/cotizaciones.actions';

/**
 * Estado de las cotizaciones usando EntityAdapter para mejor gestión
 */
export interface CotizacionesState extends EntityState<Cotizacion> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<Cotizacion> = createEntityAdapter<Cotizacion>({
  selectId: (cotizacion: Cotizacion) => cotizacion.id,
  sortComparer: (a: Cotizacion, b: Cotizacion) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
});

const initialState: CotizacionesState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const cotizacionesReducer = createReducer(
  initialState,

  // Cargar cotizaciones
  on(CotizacionesActions.loadCotizaciones, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CotizacionesActions.loadCotizacionesSuccess, (state, { cotizaciones, total, currentPage, lastPage }) => {
    return adapter.setAll(cotizaciones, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(CotizacionesActions.loadCotizacionesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar cotización por ID
  on(CotizacionesActions.loadCotizacionById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CotizacionesActions.loadCotizacionByIdSuccess, (state, { cotizacion }) => {
    return adapter.upsertOne(cotizacion, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CotizacionesActions.loadCotizacionByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear cotización
  on(CotizacionesActions.createCotizacion, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CotizacionesActions.createCotizacionSuccess, (state, { cotizacion }) => {
    return adapter.addOne(cotizacion, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CotizacionesActions.createCotizacionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar cotización
  on(CotizacionesActions.updateCotizacion, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CotizacionesActions.updateCotizacionSuccess, (state, { cotizacion }) => {
    return adapter.updateOne(
      { id: cotizacion.id, changes: cotizacion },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(CotizacionesActions.updateCotizacionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar cotización
  on(CotizacionesActions.deleteCotizacion, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CotizacionesActions.deleteCotizacionSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CotizacionesActions.deleteCotizacionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(CotizacionesActions.resetCotizacionesState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
