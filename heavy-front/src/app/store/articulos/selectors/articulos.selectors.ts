import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ArticulosState, adapter } from '../reducers/articulos.reducer';

/**
 * Selector del feature de artículos
 */
export const selectArticulosState = createFeatureSelector<ArticulosState>('articulos');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectArticulosState);

export const selectAllArticulos = selectAll;
export const selectArticulosEntities = selectEntities;
export const selectArticulosIds = selectIds;
export const selectArticulosTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectArticulosLoading = createSelector(selectArticulosState, (state: ArticulosState) => state.loading);

/**
 * Selector de error
 */
export const selectArticulosError = createSelector(selectArticulosState, (state: ArticulosState) => state.error);

/**
 * Selector de paginación
 */
export const selectArticulosPagination = createSelector(selectArticulosState, (state: ArticulosState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de artículo por ID
 */
export const selectArticuloById = (id: number) => createSelector(selectArticulosEntities, (entities) => entities[id] || null);
