import { createAction, props } from '@ngrx/store';
import { Maquina, CreateMaquinaDto, UpdateMaquinaDto } from '../../../core/models/maquina.model';

/**
 * Acciones para el módulo de Máquinas
 */

// Cargar máquinas
export const loadMaquinas = createAction(
  '[Maquinas] Load Maquinas',
  props<{ search?: string; fabricante_id?: number; tipo?: number; page?: number; per_page?: number }>()
);

export const loadMaquinasSuccess = createAction(
  '[Maquinas] Load Maquinas Success',
  props<{ maquinas: Maquina[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadMaquinasFailure = createAction(
  '[Maquinas] Load Maquinas Failure',
  props<{ error: string }>()
);

// Cargar máquina por ID
export const loadMaquinaById = createAction(
  '[Maquinas] Load Maquina By Id',
  props<{ id: number }>()
);

export const loadMaquinaByIdSuccess = createAction(
  '[Maquinas] Load Maquina By Id Success',
  props<{ maquina: Maquina }>()
);

export const loadMaquinaByIdFailure = createAction(
  '[Maquinas] Load Maquina By Id Failure',
  props<{ error: string }>()
);

// Crear máquina
export const createMaquina = createAction(
  '[Maquinas] Create Maquina',
  props<{ data: CreateMaquinaDto }>()
);

export const createMaquinaSuccess = createAction(
  '[Maquinas] Create Maquina Success',
  props<{ maquina: Maquina }>()
);

export const createMaquinaFailure = createAction(
  '[Maquinas] Create Maquina Failure',
  props<{ error: string }>()
);

// Actualizar máquina
export const updateMaquina = createAction(
  '[Maquinas] Update Maquina',
  props<{ id: number; data: UpdateMaquinaDto }>()
);

export const updateMaquinaSuccess = createAction(
  '[Maquinas] Update Maquina Success',
  props<{ maquina: Maquina }>()
);

export const updateMaquinaFailure = createAction(
  '[Maquinas] Update Maquina Failure',
  props<{ error: string }>()
);

// Eliminar máquina
export const deleteMaquina = createAction(
  '[Maquinas] Delete Maquina',
  props<{ id: number }>()
);

export const deleteMaquinaSuccess = createAction(
  '[Maquinas] Delete Maquina Success',
  props<{ id: number }>()
);

export const deleteMaquinaFailure = createAction(
  '[Maquinas] Delete Maquina Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetMaquinasState = createAction('[Maquinas] Reset State');
