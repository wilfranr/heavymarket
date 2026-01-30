import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PedidosState, selectAllPedidos as selectAllPedidosFromAdapter, selectPedidoEntities as selectPedidoEntitiesFromAdapter } from '../reducers/pedidos.reducer';

/**
 * Selectors de Pedidos
 */

// Feature Selector
export const selectPedidosState = createFeatureSelector<PedidosState>('pedidos');

// Selectors de Entity Adapter
export const selectAllPedidos = createSelector(selectPedidosState, selectAllPedidosFromAdapter);

export const selectPedidosEntities = createSelector(selectPedidosState, selectPedidoEntitiesFromAdapter);

// Selector para obtener un pedido por ID
export const selectPedidoById = (id: number) => createSelector(selectPedidosEntities, (entities) => entities[id]);

// Selectors básicos
export const selectPedidosLoading = createSelector(selectPedidosState, (state) => state.isLoading);

export const selectPedidosError = createSelector(selectPedidosState, (state) => state.error);

export const selectPedidosTotal = createSelector(selectPedidosState, (state) => state.total);

export const selectPedidosCurrentPage = createSelector(selectPedidosState, (state) => state.currentPage);

export const selectSelectedPedidoId = createSelector(selectPedidosState, (state) => state.selectedPedidoId);

// Selector compuesto: pedido seleccionado
export const selectSelectedPedido = createSelector(selectPedidosEntities, selectSelectedPedidoId, (entities, selectedId) => (selectedId ? entities[selectedId] : null));

// Selector: filtrar pedidos por estado
export const selectPedidosByEstado = (estado: string) => createSelector(selectAllPedidos, (pedidos) => pedidos.filter((pedido) => pedido.estado === estado));

// Selector: filtrar pedidos por tercero
export const selectPedidosByTercero = (terceroId: number) => createSelector(selectAllPedidos, (pedidos) => pedidos.filter((pedido) => pedido.tercero_id === terceroId));

// Selector: contar pedidos por estado
export const selectPedidosCountByEstado = createSelector(selectAllPedidos, (pedidos) => {
    const counts: Record<string, number> = {};
    pedidos.forEach((pedido) => {
        counts[pedido.estado] = (counts[pedido.estado] || 0) + 1;
    });
    return counts;
});
