import { createAction, props } from '@ngrx/store';
import { Pedido, CreatePedidoDto, UpdatePedidoDto } from '../../../core/models/pedido.model';
import { PedidoQueryParams } from '../../../core/services/pedido.service';

/**
 * Actions de Pedidos
 */

// Load Pedidos List
export const loadPedidos = createAction('[Pedidos] Load Pedidos', props<{ params?: PedidoQueryParams }>());

export const loadPedidosSuccess = createAction('[Pedidos] Load Pedidos Success', props<{ pedidos: Pedido[]; total: number; page: number }>());

export const loadPedidosFailure = createAction('[Pedidos] Load Pedidos Failure', props<{ error: string }>());

// Load Single Pedido
export const loadPedido = createAction('[Pedidos] Load Pedido', props<{ id: number }>());

export const loadPedidoSuccess = createAction('[Pedidos] Load Pedido Success', props<{ pedido: Pedido }>());

export const loadPedidoFailure = createAction('[Pedidos] Load Pedido Failure', props<{ error: string }>());

// Create Pedido
export const createPedido = createAction('[Pedidos] Create Pedido', props<{ pedido: CreatePedidoDto }>());

export const createPedidoSuccess = createAction('[Pedidos] Create Pedido Success', props<{ pedido: Pedido }>());

export const createPedidoFailure = createAction('[Pedidos] Create Pedido Failure', props<{ error: string }>());

// Update Pedido
export const updatePedido = createAction('[Pedidos] Update Pedido', props<{ id: number; changes: UpdatePedidoDto }>());

export const updatePedidoSuccess = createAction('[Pedidos] Update Pedido Success', props<{ pedido: Pedido }>());

export const updatePedidoFailure = createAction('[Pedidos] Update Pedido Failure', props<{ error: string }>());

// Delete Pedido
export const deletePedido = createAction('[Pedidos] Delete Pedido', props<{ id: number }>());

export const deletePedidoSuccess = createAction('[Pedidos] Delete Pedido Success', props<{ id: number }>());

export const deletePedidoFailure = createAction('[Pedidos] Delete Pedido Failure', props<{ error: string }>());

// Select Pedido
export const selectPedido = createAction('[Pedidos] Select Pedido', props<{ id: number | null }>());

// Clear Error
export const clearPedidosError = createAction('[Pedidos] Clear Error');
