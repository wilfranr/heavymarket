import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrdenesTrabajoState, adapter } from '../reducers/ordenes-trabajo.reducer';

/**
 * Selector del feature de órdenes de trabajo
 */
export const selectOrdenesTrabajoState = createFeatureSelector<OrdenesTrabajoState>('ordenesTrabajo');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectOrdenesTrabajoState);

export const selectAllOrdenesTrabajo = selectAll;
export const selectOrdenesTrabajoEntities = selectEntities;
export const selectOrdenesTrabajoIds = selectIds;
export const selectOrdenesTrabajoTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectOrdenesTrabajoLoading = createSelector(selectOrdenesTrabajoState, (state: OrdenesTrabajoState) => state.loading);

/**
 * Selector de error
 */
export const selectOrdenesTrabajoError = createSelector(selectOrdenesTrabajoState, (state: OrdenesTrabajoState) => state.error);

/**
 * Selector de paginación
 */
export const selectOrdenesTrabajoPagination = createSelector(selectOrdenesTrabajoState, (state: OrdenesTrabajoState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de orden de trabajo por ID
 */
export const selectOrdenTrabajoById = (id: number) => createSelector(selectOrdenesTrabajoEntities, (entities) => entities[id] || null);

/**
 * Selector de órdenes de trabajo por estado
 */
export const selectOrdenesTrabajoByEstado = (estado: string) => createSelector(selectAllOrdenesTrabajo, (ordenesTrabajo) => ordenesTrabajo.filter((ordenTrabajo) => ordenTrabajo.estado === estado));
