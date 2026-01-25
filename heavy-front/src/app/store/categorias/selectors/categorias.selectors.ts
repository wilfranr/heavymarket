import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoriasState, adapter } from '../reducers/categorias.reducer';

/**
 * Selector del feature de categorías
 */
export const selectCategoriasState = createFeatureSelector<CategoriasState>('categorias');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds } = adapter.getSelectors(selectCategoriasState);

export const selectAllCategorias = selectAll;
export const selectCategoriasEntities = selectEntities;
export const selectCategoriasIds = selectIds;

/**
 * Selector de loading
 */
export const selectCategoriasLoading = createSelector(
  selectCategoriasState,
  (state: CategoriasState) => state.loading
);

/**
 * Selector de error
 */
export const selectCategoriasError = createSelector(
  selectCategoriasState,
  (state: CategoriasState) => state.error
);

/**
 * Selector de total para paginación (desde el meta de la API)
 */
export const selectCategoriasTotal = createSelector(
  selectCategoriasState,
  (state: CategoriasState) => state.total
);

/**
 * Selector de paginación
 */
export const selectCategoriasPagination = createSelector(selectCategoriasState, (state: CategoriasState) => ({
  total: state.total,
  currentPage: state.currentPage,
  lastPage: state.lastPage,
}));

/**
 * Selector de página actual
 */
export const selectCategoriasCurrentPage = createSelector(
  selectCategoriasState,
  (state: CategoriasState) => state.currentPage
);

/**
 * Selector de categoría por ID
 */
export const selectCategoriaById = (id: number) =>
  createSelector(selectCategoriasEntities, (entities) => entities[id] || null);
