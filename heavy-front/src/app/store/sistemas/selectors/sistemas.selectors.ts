import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SistemasState, adapter } from '../reducers/sistemas.reducer';

/**
 * Selector del feature de sistemas
 */
export const selectSistemasState = createFeatureSelector<SistemasState>('sistemas');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectSistemasState);

export const selectAllSistemas = selectAll;
export const selectSistemasEntities = selectEntities;
export const selectSistemasIds = selectIds;
export const selectSistemasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectSistemasLoading = createSelector(selectSistemasState, (state: SistemasState) => state.loading);

/**
 * Selector de error
 */
export const selectSistemasError = createSelector(selectSistemasState, (state: SistemasState) => state.error);

/**
 * Selector de paginación
 */
export const selectSistemasPagination = createSelector(selectSistemasState, (state: SistemasState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de sistema por ID
 */
export const selectSistemaById = (id: number) => createSelector(selectSistemasEntities, (entities) => entities[id] || null);
