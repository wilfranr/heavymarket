import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DireccionesState, adapter } from '../reducers/direcciones.reducer';

/**
 * Selector del feature de direcciones
 */
export const selectDireccionesState = createFeatureSelector<DireccionesState>('direcciones');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectDireccionesState);

export const selectAllDirecciones = selectAll;
export const selectDireccionesEntities = selectEntities;
export const selectDireccionesIds = selectIds;
export const selectDireccionesTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectDireccionesLoading = createSelector(selectDireccionesState, (state: DireccionesState) => state.loading);

/**
 * Selector de error
 */
export const selectDireccionesError = createSelector(selectDireccionesState, (state: DireccionesState) => state.error);

/**
 * Selector de paginación
 */
export const selectDireccionesPagination = createSelector(selectDireccionesState, (state: DireccionesState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de dirección por ID
 */
export const selectDireccionById = (id: number) => createSelector(selectDireccionesEntities, (entities) => entities[id] || null);
