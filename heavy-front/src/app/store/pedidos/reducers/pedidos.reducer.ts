import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Pedido } from '../../../core/models/pedido.model';
import * as PedidosActions from '../actions/pedidos.actions';

/**
 * Estado de Pedidos usando Entity Adapter
 */
export interface PedidosState extends EntityState<Pedido> {
    selectedPedidoId: number | null;
    isLoading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
}

/**
 * Entity Adapter para gestionar la colección de pedidos
 */
export const pedidosAdapter: EntityAdapter<Pedido> = createEntityAdapter<Pedido>({
    selectId: (pedido: Pedido) => pedido.id,
    sortComparer: false // No ordenar automáticamente, usar el orden del backend
});

/**
 * Estado inicial
 */
export const initialState: PedidosState = pedidosAdapter.getInitialState({
    selectedPedidoId: null,
    isLoading: false,
    error: null,
    total: 0,
    currentPage: 1
});

/**
 * Reducer de Pedidos
 */
export const pedidosReducer = createReducer(
    initialState,

    // Load Pedidos List
    on(PedidosActions.loadPedidos, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(PedidosActions.loadPedidosSuccess, (state, { pedidos, total, page }) =>
        pedidosAdapter.setAll(pedidos, {
            ...state,
            isLoading: false,
            total,
            currentPage: page,
            error: null
        })
    ),

    on(PedidosActions.loadPedidosFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Load Single Pedido
    on(PedidosActions.loadPedido, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(PedidosActions.loadPedidoSuccess, (state, { pedido }) =>
        pedidosAdapter.upsertOne(pedido, {
            ...state,
            isLoading: false,
            error: null
        })
    ),

    on(PedidosActions.loadPedidoFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Create Pedido
    on(PedidosActions.createPedido, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(PedidosActions.createPedidoSuccess, (state, { pedido }) =>
        pedidosAdapter.addOne(pedido, {
            ...state,
            isLoading: false,
            total: state.total + 1,
            error: null
        })
    ),

    on(PedidosActions.createPedidoFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Update Pedido
    on(PedidosActions.updatePedido, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(PedidosActions.updatePedidoSuccess, (state, { pedido }) =>
        pedidosAdapter.upsertOne(pedido, {
            ...state,
            isLoading: false,
            error: null
        })
    ),

    on(PedidosActions.updatePedidoFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Delete Pedido
    on(PedidosActions.deletePedido, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),

    on(PedidosActions.deletePedidoSuccess, (state, { id }) =>
        pedidosAdapter.removeOne(id, {
            ...state,
            isLoading: false,
            total: state.total - 1,
            selectedPedidoId: state.selectedPedidoId === id ? null : state.selectedPedidoId,
            error: null
        })
    ),

    on(PedidosActions.deletePedidoFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),

    // Select Pedido
    on(PedidosActions.selectPedido, (state, { id }) => ({
        ...state,
        selectedPedidoId: id
    })),

    // Clear Error
    on(PedidosActions.clearPedidosError, (state) => ({
        ...state,
        error: null
    }))
);

/**
 * Entity Selectors exportados
 */
export const { selectIds: selectPedidoIds, selectEntities: selectPedidoEntities, selectAll: selectAllPedidos, selectTotal: selectPedidosCount } = pedidosAdapter.getSelectors();
