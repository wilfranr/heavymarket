import { createAction, props } from '@ngrx/store';
import { Direccion, CreateDireccionDto, UpdateDireccionDto } from '../../../core/models/direccion.model';

/**
 * Acciones para el módulo de Direcciones
 */

// Cargar direcciones
export const loadDirecciones = createAction('[Direcciones] Load Direcciones', props<{ page?: number; per_page?: number; search?: string; tercero_id?: number }>());

export const loadDireccionesSuccess = createAction('[Direcciones] Load Direcciones Success', props<{ direcciones: Direccion[]; total: number; currentPage: number; lastPage: number }>());

export const loadDireccionesFailure = createAction('[Direcciones] Load Direcciones Failure', props<{ error: string }>());

// Cargar dirección por ID
export const loadDireccionById = createAction('[Direcciones] Load Direccion By Id', props<{ id: number }>());

export const loadDireccionByIdSuccess = createAction('[Direcciones] Load Direccion By Id Success', props<{ direccion: Direccion }>());

export const loadDireccionByIdFailure = createAction('[Direcciones] Load Direccion By Id Failure', props<{ error: string }>());

// Crear dirección
export const createDireccion = createAction('[Direcciones] Create Direccion', props<{ data: CreateDireccionDto }>());

export const createDireccionSuccess = createAction('[Direcciones] Create Direccion Success', props<{ direccion: Direccion }>());

export const createDireccionFailure = createAction('[Direcciones] Create Direccion Failure', props<{ error: string }>());

// Actualizar dirección
export const updateDireccion = createAction('[Direcciones] Update Direccion', props<{ id: number; data: UpdateDireccionDto }>());

export const updateDireccionSuccess = createAction('[Direcciones] Update Direccion Success', props<{ direccion: Direccion }>());

export const updateDireccionFailure = createAction('[Direcciones] Update Direccion Failure', props<{ error: string }>());

// Eliminar dirección
export const deleteDireccion = createAction('[Direcciones] Delete Direccion', props<{ id: number }>());

export const deleteDireccionSuccess = createAction('[Direcciones] Delete Direccion Success', props<{ id: number }>());

export const deleteDireccionFailure = createAction('[Direcciones] Delete Direccion Failure', props<{ error: string }>());

// Resetear estado
export const resetDireccionesState = createAction('[Direcciones] Reset State');
