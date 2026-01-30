import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CotizacionesState, adapter } from '../reducers/cotizaciones.reducer';

/**
 * Selector del feature de cotizaciones
 */
export const selectCotizacionesState = createFeatureSelector<CotizacionesState>('cotizaciones');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectCotizacionesState);

export const selectAllCotizaciones = selectAll;
export const selectCotizacionesEntities = selectEntities;
export const selectCotizacionesIds = selectIds;
export const selectCotizacionesTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectCotizacionesLoading = createSelector(selectCotizacionesState, (state: CotizacionesState) => state.loading);

/**
 * Selector de error
 */
export const selectCotizacionesError = createSelector(selectCotizacionesState, (state: CotizacionesState) => state.error);

/**
 * Selector de paginación
 */
export const selectCotizacionesPagination = createSelector(selectCotizacionesState, (state: CotizacionesState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de cotización por ID
 */
export const selectCotizacionById = (id: number) => createSelector(selectCotizacionesEntities, (entities) => entities[id] || null);

/**
 * Selector de cotizaciones por estado
 */
export const selectCotizacionesByEstado = (estado: string) => createSelector(selectAllCotizaciones, (cotizaciones) => cotizaciones.filter((cotizacion) => cotizacion.estado === estado));
