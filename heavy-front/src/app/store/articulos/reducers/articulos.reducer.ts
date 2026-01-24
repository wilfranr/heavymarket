import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Articulo } from '../../../core/models/articulo.model';
import * as ArticulosActions from '../actions/articulos.actions';

/**
 * Estado de los artículos usando EntityAdapter para mejor gestión
 */
export interface ArticulosState extends EntityState<Articulo> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<Articulo> = createEntityAdapter<Articulo>({
  selectId: (articulo: Articulo) => articulo.id,
  sortComparer: (a: Articulo, b: Articulo) => a.descripcionEspecifica.localeCompare(b.descripcionEspecifica),
});

const initialState: ArticulosState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const articulosReducer = createReducer(
  initialState,

  // Cargar artículos
  on(ArticulosActions.loadArticulos, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ArticulosActions.loadArticulosSuccess, (state, { articulos, total, currentPage, lastPage }) => {
    return adapter.setAll(articulos, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(ArticulosActions.loadArticulosFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar artículo por ID
  on(ArticulosActions.loadArticuloById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ArticulosActions.loadArticuloByIdSuccess, (state, { articulo }) => {
    return adapter.upsertOne(articulo, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(ArticulosActions.loadArticuloByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear artículo
  on(ArticulosActions.createArticulo, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ArticulosActions.createArticuloSuccess, (state, { articulo }) => {
    return adapter.addOne(articulo, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(ArticulosActions.createArticuloFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar artículo
  on(ArticulosActions.updateArticulo, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ArticulosActions.updateArticuloSuccess, (state, { articulo }) => {
    return adapter.updateOne(
      { id: articulo.id, changes: articulo },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(ArticulosActions.updateArticuloFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar artículo
  on(ArticulosActions.deleteArticulo, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ArticulosActions.deleteArticuloSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(ArticulosActions.deleteArticuloFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(ArticulosActions.resetArticulosState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
