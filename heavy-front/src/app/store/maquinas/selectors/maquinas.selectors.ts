import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MaquinasState, adapter } from '../reducers/maquinas.reducer';

/**
 * Selector del feature de máquinas
 */
export const selectMaquinasState = createFeatureSelector<MaquinasState>('maquinas');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectMaquinasState);

export const selectAllMaquinas = selectAll;
export const selectMaquinasEntities = selectEntities;
export const selectMaquinasIds = selectIds;
export const selectMaquinasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectMaquinasLoading = createSelector(selectMaquinasState, (state: MaquinasState) => state.loading);

/**
 * Selector de error
 */
export const selectMaquinasError = createSelector(selectMaquinasState, (state: MaquinasState) => state.error);

/**
 * Selector de paginación
 */
export const selectMaquinasPagination = createSelector(selectMaquinasState, (state: MaquinasState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de máquina por ID
 */
export const selectMaquinaById = (id: number) => createSelector(selectMaquinasEntities, (entities) => entities[id] || null);
