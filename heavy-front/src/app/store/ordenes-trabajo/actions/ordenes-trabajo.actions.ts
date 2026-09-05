import { createAction, props } from '@ngrx/store';
import { OrdenTrabajo, OrdenTrabajoReferencia, CreateOrdenTrabajoDto, UpdateOrdenTrabajoDto, DepurarOrdenTrabajoReferenciaDto } from '../../../core/models/orden-trabajo.model';
import { CreateRecepcionCompraDto, RecepcionCompra } from '../../../core/models/recepcion-compra.model';

/**
 * Acciones para el módulo de Órdenes de Trabajo
 */

// Cargar órdenes de trabajo
export const loadOrdenesTrabajo = createAction('[OrdenesTrabajo] Load OrdenesTrabajo', props<{ estado?: string; tercero_id?: number; pedido_id?: number; transportadora_id?: number; page?: number; per_page?: number }>());

export const loadOrdenesTrabajoSuccess = createAction('[OrdenesTrabajo] Load OrdenesTrabajo Success', props<{ ordenesTrabajo: OrdenTrabajo[]; total: number; currentPage: number; lastPage: number }>());

export const loadOrdenesTrabajoFailure = createAction('[OrdenesTrabajo] Load OrdenesTrabajo Failure', props<{ error: string }>());

// Cargar orden de trabajo por ID
export const loadOrdenTrabajoById = createAction('[OrdenesTrabajo] Load OrdenTrabajo By Id', props<{ id: number }>());

export const loadOrdenTrabajoByIdSuccess = createAction('[OrdenesTrabajo] Load OrdenTrabajo By Id Success', props<{ ordenTrabajo: OrdenTrabajo }>());

export const loadOrdenTrabajoByIdFailure = createAction('[OrdenesTrabajo] Load OrdenTrabajo By Id Failure', props<{ error: string }>());

// Crear orden de trabajo
export const createOrdenTrabajo = createAction('[OrdenesTrabajo] Create OrdenTrabajo', props<{ data: CreateOrdenTrabajoDto }>());

export const createOrdenTrabajoSuccess = createAction('[OrdenesTrabajo] Create OrdenTrabajo Success', props<{ ordenTrabajo: OrdenTrabajo }>());

export const createOrdenTrabajoFailure = createAction('[OrdenesTrabajo] Create OrdenTrabajo Failure', props<{ error: string }>());

// Actualizar orden de trabajo
export const updateOrdenTrabajo = createAction('[OrdenesTrabajo] Update OrdenTrabajo', props<{ id: number; data: UpdateOrdenTrabajoDto }>());

export const updateOrdenTrabajoSuccess = createAction('[OrdenesTrabajo] Update OrdenTrabajo Success', props<{ ordenTrabajo: OrdenTrabajo }>());

export const updateOrdenTrabajoFailure = createAction('[OrdenesTrabajo] Update OrdenTrabajo Failure', props<{ error: string }>());

// Registrar recepción de compra desde OT
export const registrarRecepcionCompra = createAction('[OrdenesTrabajo] Registrar Recepcion Compra', props<{ ordenTrabajoId: number; data: CreateRecepcionCompraDto }>());

export const registrarRecepcionCompraSuccess = createAction('[OrdenesTrabajo] Registrar Recepcion Compra Success', props<{ ordenTrabajoId: number; recepcion: RecepcionCompra }>());

export const registrarRecepcionCompraFailure = createAction('[OrdenesTrabajo] Registrar Recepcion Compra Failure', props<{ error: string }>());

// Depurar (marcar como faltante definitivo) una referencia de la OT
export const depurarReferencia = createAction('[OrdenesTrabajo] Depurar Referencia', props<{ ordenTrabajoId: number; referenciaId: number; data: DepurarOrdenTrabajoReferenciaDto }>());

export const depurarReferenciaSuccess = createAction('[OrdenesTrabajo] Depurar Referencia Success', props<{ ordenTrabajoId: number; referencia: OrdenTrabajoReferencia }>());

export const depurarReferenciaFailure = createAction('[OrdenesTrabajo] Depurar Referencia Failure', props<{ error: string }>());

// Eliminar orden de trabajo
export const deleteOrdenTrabajo = createAction('[OrdenesTrabajo] Delete OrdenTrabajo', props<{ id: number }>());

export const deleteOrdenTrabajoSuccess = createAction('[OrdenesTrabajo] Delete OrdenTrabajo Success', props<{ id: number }>());

export const deleteOrdenTrabajoFailure = createAction('[OrdenesTrabajo] Delete OrdenTrabajo Failure', props<{ error: string }>());

// Resetear estado
export const resetOrdenesTrabajoState = createAction('[OrdenesTrabajo] Reset State');
