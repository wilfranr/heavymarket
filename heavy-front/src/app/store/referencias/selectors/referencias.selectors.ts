import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReferenciasState, adapter } from '../reducers/referencias.reducer';

/**
 * Selector del feature de referencias
 */
export const selectReferenciasState = createFeatureSelector<ReferenciasState>('referencias');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectReferenciasState);

export const selectAllReferencias = selectAll;
export const selectReferenciasEntities = selectEntities;
export const selectReferenciasIds = selectIds;
export const selectReferenciasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectReferenciasLoading = createSelector(selectReferenciasState, (state: ReferenciasState) => state.loading);

/**
 * Selector de error
 */
export const selectReferenciasError = createSelector(selectReferenciasState, (state: ReferenciasState) => state.error);

/**
 * Selector de paginación
 */
export const selectReferenciasPagination = createSelector(selectReferenciasState, (state: ReferenciasState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de referencia por ID
 */
export const selectReferenciaById = (id: number) => createSelector(selectReferenciasEntities, (entities) => entities[id] || null);
