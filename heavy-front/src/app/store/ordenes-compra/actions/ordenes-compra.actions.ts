import { createAction, props } from '@ngrx/store';
import { OrdenCompra, CreateOrdenCompraDto, UpdateOrdenCompraDto } from '../../../core/models/orden-compra.model';

/**
 * Acciones para el módulo de Órdenes de Compra
 */

// Cargar órdenes de compra
export const loadOrdenesCompra = createAction('[OrdenesCompra] Load OrdenesCompra', props<{ estado?: string; proveedor_id?: number; tercero_id?: number; pedido_id?: number; color?: string; page?: number; per_page?: number }>());

export const loadOrdenesCompraSuccess = createAction('[OrdenesCompra] Load OrdenesCompra Success', props<{ ordenesCompra: OrdenCompra[]; total: number; currentPage: number; lastPage: number }>());

export const loadOrdenesCompraFailure = createAction('[OrdenesCompra] Load OrdenesCompra Failure', props<{ error: string }>());

// Cargar orden de compra por ID
export const loadOrdenCompraById = createAction('[OrdenesCompra] Load OrdenCompra By Id', props<{ id: number }>());

export const loadOrdenCompraByIdSuccess = createAction('[OrdenesCompra] Load OrdenCompra By Id Success', props<{ ordenCompra: OrdenCompra }>());

export const loadOrdenCompraByIdFailure = createAction('[OrdenesCompra] Load OrdenCompra By Id Failure', props<{ error: string }>());

// Crear orden de compra
export const createOrdenCompra = createAction('[OrdenesCompra] Create OrdenCompra', props<{ data: CreateOrdenCompraDto }>());

export const createOrdenCompraSuccess = createAction('[OrdenesCompra] Create OrdenCompra Success', props<{ ordenCompra: OrdenCompra }>());

export const createOrdenCompraFailure = createAction('[OrdenesCompra] Create OrdenCompra Failure', props<{ error: string }>());

// Actualizar orden de compra
export const updateOrdenCompra = createAction('[OrdenesCompra] Update OrdenCompra', props<{ id: number; data: UpdateOrdenCompraDto }>());

export const updateOrdenCompraSuccess = createAction('[OrdenesCompra] Update OrdenCompra Success', props<{ ordenCompra: OrdenCompra }>());

export const updateOrdenCompraFailure = createAction('[OrdenesCompra] Update OrdenCompra Failure', props<{ error: string }>());

// Eliminar orden de compra
export const deleteOrdenCompra = createAction('[OrdenesCompra] Delete OrdenCompra', props<{ id: number }>());

export const deleteOrdenCompraSuccess = createAction('[OrdenesCompra] Delete OrdenCompra Success', props<{ id: number }>());

export const deleteOrdenCompraFailure = createAction('[OrdenesCompra] Delete OrdenCompra Failure', props<{ error: string }>());

// Resetear estado
export const resetOrdenesCompraState = createAction('[OrdenesCompra] Reset State');
