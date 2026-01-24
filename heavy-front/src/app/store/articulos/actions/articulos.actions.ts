import { createAction, props } from '@ngrx/store';
import { Articulo, CreateArticuloDto, UpdateArticuloDto } from '../../../core/models/articulo.model';

/**
 * Acciones para el módulo de Artículos
 */

// Cargar artículos
export const loadArticulos = createAction(
  '[Articulos] Load Articulos',
  props<{ search?: string; page?: number; per_page?: number }>()
);

export const loadArticulosSuccess = createAction(
  '[Articulos] Load Articulos Success',
  props<{ articulos: Articulo[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadArticulosFailure = createAction(
  '[Articulos] Load Articulos Failure',
  props<{ error: string }>()
);

// Cargar artículo por ID
export const loadArticuloById = createAction(
  '[Articulos] Load Articulo By Id',
  props<{ id: number }>()
);

export const loadArticuloByIdSuccess = createAction(
  '[Articulos] Load Articulo By Id Success',
  props<{ articulo: Articulo }>()
);

export const loadArticuloByIdFailure = createAction(
  '[Articulos] Load Articulo By Id Failure',
  props<{ error: string }>()
);

// Crear artículo
export const createArticulo = createAction(
  '[Articulos] Create Articulo',
  props<{ data: CreateArticuloDto }>()
);

export const createArticuloSuccess = createAction(
  '[Articulos] Create Articulo Success',
  props<{ articulo: Articulo }>()
);

export const createArticuloFailure = createAction(
  '[Articulos] Create Articulo Failure',
  props<{ error: string }>()
);

// Actualizar artículo
export const updateArticulo = createAction(
  '[Articulos] Update Articulo',
  props<{ id: number; data: UpdateArticuloDto }>()
);

export const updateArticuloSuccess = createAction(
  '[Articulos] Update Articulo Success',
  props<{ articulo: Articulo }>()
);

export const updateArticuloFailure = createAction(
  '[Articulos] Update Articulo Failure',
  props<{ error: string }>()
);

// Eliminar artículo
export const deleteArticulo = createAction(
  '[Articulos] Delete Articulo',
  props<{ id: number }>()
);

export const deleteArticuloSuccess = createAction(
  '[Articulos] Delete Articulo Success',
  props<{ id: number }>()
);

export const deleteArticuloFailure = createAction(
  '[Articulos] Delete Articulo Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetArticulosState = createAction('[Articulos] Reset State');
