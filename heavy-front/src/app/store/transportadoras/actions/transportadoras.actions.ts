import { createAction, props } from '@ngrx/store';
import { Transportadora, CreateTransportadoraDto, UpdateTransportadoraDto } from '../../../core/models/transportadora.model';

/**
 * Acciones para el módulo de Transportadoras
 */

// Cargar transportadoras
export const loadTransportadoras = createAction('[Transportadoras] Load Transportadoras', props<{ page?: number; per_page?: number; search?: string }>());

export const loadTransportadorasSuccess = createAction('[Transportadoras] Load Transportadoras Success', props<{ transportadoras: Transportadora[]; total: number; currentPage: number; lastPage: number }>());

export const loadTransportadorasFailure = createAction('[Transportadoras] Load Transportadoras Failure', props<{ error: string }>());

// Cargar transportadora por ID
export const loadTransportadoraById = createAction('[Transportadoras] Load Transportadora By Id', props<{ id: number }>());

export const loadTransportadoraByIdSuccess = createAction('[Transportadoras] Load Transportadora By Id Success', props<{ transportadora: Transportadora }>());

export const loadTransportadoraByIdFailure = createAction('[Transportadoras] Load Transportadora By Id Failure', props<{ error: string }>());

// Crear transportadora
export const createTransportadora = createAction('[Transportadoras] Create Transportadora', props<{ data: CreateTransportadoraDto }>());

export const createTransportadoraSuccess = createAction('[Transportadoras] Create Transportadora Success', props<{ transportadora: Transportadora }>());

export const createTransportadoraFailure = createAction('[Transportadoras] Create Transportadora Failure', props<{ error: string }>());

// Actualizar transportadora
export const updateTransportadora = createAction('[Transportadoras] Update Transportadora', props<{ id: number; data: UpdateTransportadoraDto }>());

export const updateTransportadoraSuccess = createAction('[Transportadoras] Update Transportadora Success', props<{ transportadora: Transportadora }>());

export const updateTransportadoraFailure = createAction('[Transportadoras] Update Transportadora Failure', props<{ error: string }>());

// Eliminar transportadora
export const deleteTransportadora = createAction('[Transportadoras] Delete Transportadora', props<{ id: number }>());

export const deleteTransportadoraSuccess = createAction('[Transportadoras] Delete Transportadora Success', props<{ id: number }>());

export const deleteTransportadoraFailure = createAction('[Transportadoras] Delete Transportadora Failure', props<{ error: string }>());

// Resetear estado
export const resetTransportadorasState = createAction('[Transportadoras] Reset State');
