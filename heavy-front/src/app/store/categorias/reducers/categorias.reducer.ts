import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Categoria } from '../../../core/models/categoria.model';
import * as CategoriasActions from '../actions/categorias.actions';

/**
 * Estado de las categorías usando EntityAdapter para mejor gestión
 */
export interface CategoriasState extends EntityState<Categoria> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<Categoria> = createEntityAdapter<Categoria>({
  selectId: (categoria: Categoria) => categoria.id,
  sortComparer: (a: Categoria, b: Categoria) => 
    a.nombre.localeCompare(b.nombre),
});

const initialState: CategoriasState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const categoriasReducer = createReducer(
  initialState,

  // Cargar categorías
  on(CategoriasActions.loadCategorias, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriasActions.loadCategoriasSuccess, (state, { categorias, total, currentPage, lastPage }) => {
    return adapter.setAll(categorias, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(CategoriasActions.loadCategoriasFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar categoría por ID
  on(CategoriasActions.loadCategoriaById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriasActions.loadCategoriaByIdSuccess, (state, { categoria }) => {
    return adapter.upsertOne(categoria, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CategoriasActions.loadCategoriaByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear categoría
  on(CategoriasActions.createCategoria, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriasActions.createCategoriaSuccess, (state, { categoria }) => {
    return adapter.addOne(categoria, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CategoriasActions.createCategoriaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar categoría
  on(CategoriasActions.updateCategoria, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriasActions.updateCategoriaSuccess, (state, { categoria }) => {
    return adapter.updateOne(
      { id: categoria.id, changes: categoria },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(CategoriasActions.updateCategoriaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar categoría
  on(CategoriasActions.deleteCategoria, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CategoriasActions.deleteCategoriaSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(CategoriasActions.deleteCategoriaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(CategoriasActions.resetCategoriasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
