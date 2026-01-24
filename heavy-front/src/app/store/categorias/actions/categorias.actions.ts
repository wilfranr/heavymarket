import { createAction, props } from '@ngrx/store';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../../../core/models/categoria.model';

/**
 * Acciones para el módulo de Categorías
 */

// Cargar categorías
export const loadCategorias = createAction(
  '[Categorias] Load Categorias',
  props<{ page?: number; per_page?: number; search?: string }>()
);

export const loadCategoriasSuccess = createAction(
  '[Categorias] Load Categorias Success',
  props<{ categorias: Categoria[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadCategoriasFailure = createAction(
  '[Categorias] Load Categorias Failure',
  props<{ error: string }>()
);

// Cargar categoría por ID
export const loadCategoriaById = createAction(
  '[Categorias] Load Categoria By Id',
  props<{ id: number }>()
);

export const loadCategoriaByIdSuccess = createAction(
  '[Categorias] Load Categoria By Id Success',
  props<{ categoria: Categoria }>()
);

export const loadCategoriaByIdFailure = createAction(
  '[Categorias] Load Categoria By Id Failure',
  props<{ error: string }>()
);

// Crear categoría
export const createCategoria = createAction(
  '[Categorias] Create Categoria',
  props<{ data: CreateCategoriaDto }>()
);

export const createCategoriaSuccess = createAction(
  '[Categorias] Create Categoria Success',
  props<{ categoria: Categoria }>()
);

export const createCategoriaFailure = createAction(
  '[Categorias] Create Categoria Failure',
  props<{ error: string }>()
);

// Actualizar categoría
export const updateCategoria = createAction(
  '[Categorias] Update Categoria',
  props<{ id: number; data: UpdateCategoriaDto }>()
);

export const updateCategoriaSuccess = createAction(
  '[Categorias] Update Categoria Success',
  props<{ categoria: Categoria }>()
);

export const updateCategoriaFailure = createAction(
  '[Categorias] Update Categoria Failure',
  props<{ error: string }>()
);

// Eliminar categoría
export const deleteCategoria = createAction(
  '[Categorias] Delete Categoria',
  props<{ id: number }>()
);

export const deleteCategoriaSuccess = createAction(
  '[Categorias] Delete Categoria Success',
  props<{ id: number }>()
);

export const deleteCategoriaFailure = createAction(
  '[Categorias] Delete Categoria Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetCategoriasState = createAction('[Categorias] Reset State');
