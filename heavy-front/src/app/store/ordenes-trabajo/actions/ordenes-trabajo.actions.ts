import { createAction, props } from '@ngrx/store';
import { OrdenTrabajo, CreateOrdenTrabajoDto, UpdateOrdenTrabajoDto } from '../../../core/models/orden-trabajo.model';

/**
 * Acciones para el módulo de Órdenes de Trabajo
 */

// Cargar órdenes de trabajo
export const loadOrdenesTrabajo = createAction(
  '[OrdenesTrabajo] Load OrdenesTrabajo',
  props<{ estado?: string; tercero_id?: number; pedido_id?: number; transportadora_id?: number; page?: number; per_page?: number }>()
);

export const loadOrdenesTrabajoSuccess = createAction(
  '[OrdenesTrabajo] Load OrdenesTrabajo Success',
  props<{ ordenesTrabajo: OrdenTrabajo[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadOrdenesTrabajoFailure = createAction(
  '[OrdenesTrabajo] Load OrdenesTrabajo Failure',
  props<{ error: string }>()
);

// Cargar orden de trabajo por ID
export const loadOrdenTrabajoById = createAction(
  '[OrdenesTrabajo] Load OrdenTrabajo By Id',
  props<{ id: number }>()
);

export const loadOrdenTrabajoByIdSuccess = createAction(
  '[OrdenesTrabajo] Load OrdenTrabajo By Id Success',
  props<{ ordenTrabajo: OrdenTrabajo }>()
);

export const loadOrdenTrabajoByIdFailure = createAction(
  '[OrdenesTrabajo] Load OrdenTrabajo By Id Failure',
  props<{ error: string }>()
);

// Crear orden de trabajo
export const createOrdenTrabajo = createAction(
  '[OrdenesTrabajo] Create OrdenTrabajo',
  props<{ data: CreateOrdenTrabajoDto }>()
);

export const createOrdenTrabajoSuccess = createAction(
  '[OrdenesTrabajo] Create OrdenTrabajo Success',
  props<{ ordenTrabajo: OrdenTrabajo }>()
);

export const createOrdenTrabajoFailure = createAction(
  '[OrdenesTrabajo] Create OrdenTrabajo Failure',
  props<{ error: string }>()
);

// Actualizar orden de trabajo
export const updateOrdenTrabajo = createAction(
  '[OrdenesTrabajo] Update OrdenTrabajo',
  props<{ id: number; data: UpdateOrdenTrabajoDto }>()
);

export const updateOrdenTrabajoSuccess = createAction(
  '[OrdenesTrabajo] Update OrdenTrabajo Success',
  props<{ ordenTrabajo: OrdenTrabajo }>()
);

export const updateOrdenTrabajoFailure = createAction(
  '[OrdenesTrabajo] Update OrdenTrabajo Failure',
  props<{ error: string }>()
);

// Eliminar orden de trabajo
export const deleteOrdenTrabajo = createAction(
  '[OrdenesTrabajo] Delete OrdenTrabajo',
  props<{ id: number }>()
);

export const deleteOrdenTrabajoSuccess = createAction(
  '[OrdenesTrabajo] Delete OrdenTrabajo Success',
  props<{ id: number }>()
);

export const deleteOrdenTrabajoFailure = createAction(
  '[OrdenesTrabajo] Delete OrdenTrabajo Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetOrdenesTrabajoState = createAction('[OrdenesTrabajo] Reset State');
