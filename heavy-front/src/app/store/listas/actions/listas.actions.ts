import { createAction, props } from '@ngrx/store';
import { Lista, CreateListaDto, UpdateListaDto, ListaTipo } from '../../../core/models/lista.model';

/**
 * Acciones para el módulo de Listas
 */

// Cargar listas
export const loadListas = createAction('[Listas] Load Listas', props<{ tipo?: ListaTipo; search?: string; page?: number; per_page?: number }>());

export const loadListasSuccess = createAction('[Listas] Load Listas Success', props<{ listas: Lista[]; total: number; currentPage: number; lastPage: number }>());

export const loadListasFailure = createAction('[Listas] Load Listas Failure', props<{ error: string }>());

// Cargar lista por ID
export const loadListaById = createAction('[Listas] Load Lista By Id', props<{ id: number }>());

export const loadListaByIdSuccess = createAction('[Listas] Load Lista By Id Success', props<{ lista: Lista }>());

export const loadListaByIdFailure = createAction('[Listas] Load Lista By Id Failure', props<{ error: string }>());

// Cargar listas por tipo
export const loadListasByTipo = createAction('[Listas] Load Listas By Tipo', props<{ tipo: ListaTipo }>());

export const loadListasByTipoSuccess = createAction('[Listas] Load Listas By Tipo Success', props<{ tipo: ListaTipo; listas: Lista[] }>());

export const loadListasByTipoFailure = createAction('[Listas] Load Listas By Tipo Failure', props<{ error: string }>());

// Crear lista
export const createLista = createAction('[Listas] Create Lista', props<{ data: CreateListaDto }>());

export const createListaSuccess = createAction('[Listas] Create Lista Success', props<{ lista: Lista }>());

export const createListaFailure = createAction('[Listas] Create Lista Failure', props<{ error: string }>());

// Actualizar lista
export const updateLista = createAction('[Listas] Update Lista', props<{ id: number; data: UpdateListaDto }>());

export const updateListaSuccess = createAction('[Listas] Update Lista Success', props<{ lista: Lista }>());

export const updateListaFailure = createAction('[Listas] Update Lista Failure', props<{ error: string }>());

// Eliminar lista
export const deleteLista = createAction('[Listas] Delete Lista', props<{ id: number }>());

export const deleteListaSuccess = createAction('[Listas] Delete Lista Success', props<{ id: number }>());

export const deleteListaFailure = createAction('[Listas] Delete Lista Failure', props<{ error: string }>());

// Resetear estado
export const resetListasState = createAction('[Listas] Reset State');
