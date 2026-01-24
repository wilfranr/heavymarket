import { createAction, props } from '@ngrx/store';
import { Fabricante, CreateFabricanteDto, UpdateFabricanteDto } from '../../../core/models/fabricante.model';

/**
 * Acciones para el módulo de Fabricantes
 */

// Cargar fabricantes
export const loadFabricantes = createAction(
  '[Fabricantes] Load Fabricantes',
  props<{ search?: string; page?: number; per_page?: number }>()
);

export const loadFabricantesSuccess = createAction(
  '[Fabricantes] Load Fabricantes Success',
  props<{ fabricantes: Fabricante[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadFabricantesFailure = createAction(
  '[Fabricantes] Load Fabricantes Failure',
  props<{ error: string }>()
);

// Cargar fabricante por ID
export const loadFabricanteById = createAction(
  '[Fabricantes] Load Fabricante By Id',
  props<{ id: number }>()
);

export const loadFabricanteByIdSuccess = createAction(
  '[Fabricantes] Load Fabricante By Id Success',
  props<{ fabricante: Fabricante }>()
);

export const loadFabricanteByIdFailure = createAction(
  '[Fabricantes] Load Fabricante By Id Failure',
  props<{ error: string }>()
);

// Crear fabricante
export const createFabricante = createAction(
  '[Fabricantes] Create Fabricante',
  props<{ data: CreateFabricanteDto }>()
);

export const createFabricanteSuccess = createAction(
  '[Fabricantes] Create Fabricante Success',
  props<{ fabricante: Fabricante }>()
);

export const createFabricanteFailure = createAction(
  '[Fabricantes] Create Fabricante Failure',
  props<{ error: string }>()
);

// Actualizar fabricante
export const updateFabricante = createAction(
  '[Fabricantes] Update Fabricante',
  props<{ id: number; data: UpdateFabricanteDto }>()
);

export const updateFabricanteSuccess = createAction(
  '[Fabricantes] Update Fabricante Success',
  props<{ fabricante: Fabricante }>()
);

export const updateFabricanteFailure = createAction(
  '[Fabricantes] Update Fabricante Failure',
  props<{ error: string }>()
);

// Eliminar fabricante
export const deleteFabricante = createAction(
  '[Fabricantes] Delete Fabricante',
  props<{ id: number }>()
);

export const deleteFabricanteSuccess = createAction(
  '[Fabricantes] Delete Fabricante Success',
  props<{ id: number }>()
);

export const deleteFabricanteFailure = createAction(
  '[Fabricantes] Delete Fabricante Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetFabricantesState = createAction('[Fabricantes] Reset State');
