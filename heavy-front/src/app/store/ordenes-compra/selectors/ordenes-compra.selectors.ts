import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrdenesCompraState, adapter } from '../reducers/ordenes-compra.reducer';

/**
 * Selector del feature de órdenes de compra
 */
export const selectOrdenesCompraState = createFeatureSelector<OrdenesCompraState>('ordenesCompra');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectOrdenesCompraState);

export const selectAllOrdenesCompra = selectAll;
export const selectOrdenesCompraEntities = selectEntities;
export const selectOrdenesCompraIds = selectIds;
export const selectOrdenesCompraTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectOrdenesCompraLoading = createSelector(selectOrdenesCompraState, (state: OrdenesCompraState) => state.loading);

/**
 * Selector de error
 */
export const selectOrdenesCompraError = createSelector(selectOrdenesCompraState, (state: OrdenesCompraState) => state.error);

/**
 * Selector de paginación
 */
export const selectOrdenesCompraPagination = createSelector(selectOrdenesCompraState, (state: OrdenesCompraState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage
}));

/**
 * Selector de orden de compra por ID
 */
export const selectOrdenCompraById = (id: number) => createSelector(selectOrdenesCompraEntities, (entities) => entities[id] || null);

/**
 * Selector de órdenes de compra por estado
 */
export const selectOrdenesCompraByEstado = (estado: string) => createSelector(selectAllOrdenesCompra, (ordenesCompra) => ordenesCompra.filter((ordenCompra) => ordenCompra.estado === estado));

/**
 * Selector de órdenes de compra por color
 */
export const selectOrdenesCompraByColor = (color: string) => createSelector(selectAllOrdenesCompra, (ordenesCompra) => ordenesCompra.filter((ordenCompra) => ordenCompra.color === color));
