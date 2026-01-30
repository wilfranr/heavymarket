import { createAction, props } from '@ngrx/store';
import { TRM, CreateTRMDto, UpdateTRMDto } from '../../../core/models/trm.model';

/**
 * Acciones para el módulo de TRM
 */

// Cargar TRMs
export const loadTRMs = createAction('[TRMs] Load TRMs', props<{ page?: number; per_page?: number }>());

export const loadTRMsSuccess = createAction('[TRMs] Load TRMs Success', props<{ trms: TRM[]; total: number; currentPage: number; lastPage: number }>());

export const loadTRMsFailure = createAction('[TRMs] Load TRMs Failure', props<{ error: string }>());

// Cargar TRM más reciente
export const loadLatestTRM = createAction('[TRMs] Load Latest TRM');

export const loadLatestTRMSuccess = createAction('[TRMs] Load Latest TRM Success', props<{ trm: TRM }>());

export const loadLatestTRMFailure = createAction('[TRMs] Load Latest TRM Failure', props<{ error: string }>());

// Cargar TRM por ID
export const loadTRMById = createAction('[TRMs] Load TRM By Id', props<{ id: number }>());

export const loadTRMByIdSuccess = createAction('[TRMs] Load TRM By Id Success', props<{ trm: TRM }>());

export const loadTRMByIdFailure = createAction('[TRMs] Load TRM By Id Failure', props<{ error: string }>());

// Crear TRM
export const createTRM = createAction('[TRMs] Create TRM', props<{ data: CreateTRMDto }>());

export const createTRMSuccess = createAction('[TRMs] Create TRM Success', props<{ trm: TRM }>());

export const createTRMFailure = createAction('[TRMs] Create TRM Failure', props<{ error: string }>());

// Actualizar TRM
export const updateTRM = createAction('[TRMs] Update TRM', props<{ id: number; data: UpdateTRMDto }>());

export const updateTRMSuccess = createAction('[TRMs] Update TRM Success', props<{ trm: TRM }>());

export const updateTRMFailure = createAction('[TRMs] Update TRM Failure', props<{ error: string }>());

// Eliminar TRM
export const deleteTRM = createAction('[TRMs] Delete TRM', props<{ id: number }>());

export const deleteTRMSuccess = createAction('[TRMs] Delete TRM Success', props<{ id: number }>());

export const deleteTRMFailure = createAction('[TRMs] Delete TRM Failure', props<{ error: string }>());

// Resetear estado
export const resetTRMsState = createAction('[TRMs] Reset State');
