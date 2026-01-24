import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FabricantesState, adapter } from '../reducers/fabricantes.reducer';

/**
 * Selector del feature de fabricantes
 */
export const selectFabricantesState = createFeatureSelector<FabricantesState>('fabricantes');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectFabricantesState);

export const selectAllFabricantes = selectAll;
export const selectFabricantesEntities = selectEntities;
export const selectFabricantesIds = selectIds;
export const selectFabricantesTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectFabricantesLoading = createSelector(selectFabricantesState, (state: FabricantesState) => state.loading);

/**
 * Selector de error
 */
export const selectFabricantesError = createSelector(selectFabricantesState, (state: FabricantesState) => state.error);

/**
 * Selector de paginación
 */
export const selectFabricantesPagination = createSelector(selectFabricantesState, (state: FabricantesState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de fabricante por ID
 */
export const selectFabricanteById = (id: number) => createSelector(selectFabricantesEntities, (entities) => entities[id] || null);
