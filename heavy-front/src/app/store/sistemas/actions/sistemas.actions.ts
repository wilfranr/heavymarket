import { createAction, props } from '@ngrx/store';
import { Sistema, CreateSistemaDto, UpdateSistemaDto } from '../../../core/models/sistema.model';

/**
 * Acciones para el módulo de Sistemas
 */

// Cargar sistemas
export const loadSistemas = createAction('[Sistemas] Load Sistemas', props<{ search?: string; page?: number; per_page?: number }>());

export const loadSistemasSuccess = createAction('[Sistemas] Load Sistemas Success', props<{ sistemas: Sistema[]; total: number; currentPage: number; lastPage: number }>());

export const loadSistemasFailure = createAction('[Sistemas] Load Sistemas Failure', props<{ error: string }>());

// Cargar sistema por ID
export const loadSistemaById = createAction('[Sistemas] Load Sistema By Id', props<{ id: number }>());

export const loadSistemaByIdSuccess = createAction('[Sistemas] Load Sistema By Id Success', props<{ sistema: Sistema }>());

export const loadSistemaByIdFailure = createAction('[Sistemas] Load Sistema By Id Failure', props<{ error: string }>());

// Crear sistema
export const createSistema = createAction('[Sistemas] Create Sistema', props<{ data: CreateSistemaDto }>());

export const createSistemaSuccess = createAction('[Sistemas] Create Sistema Success', props<{ sistema: Sistema }>());

export const createSistemaFailure = createAction('[Sistemas] Create Sistema Failure', props<{ error: string }>());

// Actualizar sistema
export const updateSistema = createAction('[Sistemas] Update Sistema', props<{ id: number; data: UpdateSistemaDto }>());

export const updateSistemaSuccess = createAction('[Sistemas] Update Sistema Success', props<{ sistema: Sistema }>());

export const updateSistemaFailure = createAction('[Sistemas] Update Sistema Failure', props<{ error: string }>());

// Eliminar sistema
export const deleteSistema = createAction('[Sistemas] Delete Sistema', props<{ id: number }>());

export const deleteSistemaSuccess = createAction('[Sistemas] Delete Sistema Success', props<{ id: number }>());

export const deleteSistemaFailure = createAction('[Sistemas] Delete Sistema Failure', props<{ error: string }>());

// Resetear estado
export const resetSistemasState = createAction('[Sistemas] Reset State');
