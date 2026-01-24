import { createAction, props } from '@ngrx/store';
import { Referencia, CreateReferenciaDto, UpdateReferenciaDto } from '../../../core/models/referencia.model';

/**
 * Acciones para el módulo de Referencias
 */

// Cargar referencias
export const loadReferencias = createAction(
  '[Referencias] Load Referencias',
  props<{ search?: string; marca_id?: number; page?: number; per_page?: number }>()
);

export const loadReferenciasSuccess = createAction(
  '[Referencias] Load Referencias Success',
  props<{ referencias: Referencia[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadReferenciasFailure = createAction(
  '[Referencias] Load Referencias Failure',
  props<{ error: string }>()
);

// Cargar referencia por ID
export const loadReferenciaById = createAction(
  '[Referencias] Load Referencia By Id',
  props<{ id: number }>()
);

export const loadReferenciaByIdSuccess = createAction(
  '[Referencias] Load Referencia By Id Success',
  props<{ referencia: Referencia }>()
);

export const loadReferenciaByIdFailure = createAction(
  '[Referencias] Load Referencia By Id Failure',
  props<{ error: string }>()
);

// Crear referencia
export const createReferencia = createAction(
  '[Referencias] Create Referencia',
  props<{ data: CreateReferenciaDto }>()
);

export const createReferenciaSuccess = createAction(
  '[Referencias] Create Referencia Success',
  props<{ referencia: Referencia }>()
);

export const createReferenciaFailure = createAction(
  '[Referencias] Create Referencia Failure',
  props<{ error: string }>()
);

// Actualizar referencia
export const updateReferencia = createAction(
  '[Referencias] Update Referencia',
  props<{ id: number; data: UpdateReferenciaDto }>()
);

export const updateReferenciaSuccess = createAction(
  '[Referencias] Update Referencia Success',
  props<{ referencia: Referencia }>()
);

export const updateReferenciaFailure = createAction(
  '[Referencias] Update Referencia Failure',
  props<{ error: string }>()
);

// Eliminar referencia
export const deleteReferencia = createAction(
  '[Referencias] Delete Referencia',
  props<{ id: number }>()
);

export const deleteReferenciaSuccess = createAction(
  '[Referencias] Delete Referencia Success',
  props<{ id: number }>()
);

export const deleteReferenciaFailure = createAction(
  '[Referencias] Delete Referencia Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetReferenciasState = createAction('[Referencias] Reset State');
