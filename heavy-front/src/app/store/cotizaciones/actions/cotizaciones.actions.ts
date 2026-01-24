import { createAction, props } from '@ngrx/store';
import { Cotizacion, CreateCotizacionDto, UpdateCotizacionDto } from '../../../core/models/cotizacion.model';

/**
 * Acciones para el módulo de Cotizaciones
 */

// Cargar cotizaciones
export const loadCotizaciones = createAction(
  '[Cotizaciones] Load Cotizaciones',
  props<{ estado?: string; tercero_id?: number; pedido_id?: number; page?: number; per_page?: number }>()
);

export const loadCotizacionesSuccess = createAction(
  '[Cotizaciones] Load Cotizaciones Success',
  props<{ cotizaciones: Cotizacion[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadCotizacionesFailure = createAction(
  '[Cotizaciones] Load Cotizaciones Failure',
  props<{ error: string }>()
);

// Cargar cotización por ID
export const loadCotizacionById = createAction(
  '[Cotizaciones] Load Cotizacion By Id',
  props<{ id: number }>()
);

export const loadCotizacionByIdSuccess = createAction(
  '[Cotizaciones] Load Cotizacion By Id Success',
  props<{ cotizacion: Cotizacion }>()
);

export const loadCotizacionByIdFailure = createAction(
  '[Cotizaciones] Load Cotizacion By Id Failure',
  props<{ error: string }>()
);

// Crear cotización
export const createCotizacion = createAction(
  '[Cotizaciones] Create Cotizacion',
  props<{ data: CreateCotizacionDto }>()
);

export const createCotizacionSuccess = createAction(
  '[Cotizaciones] Create Cotizacion Success',
  props<{ cotizacion: Cotizacion }>()
);

export const createCotizacionFailure = createAction(
  '[Cotizaciones] Create Cotizacion Failure',
  props<{ error: string }>()
);

// Actualizar cotización
export const updateCotizacion = createAction(
  '[Cotizaciones] Update Cotizacion',
  props<{ id: number; data: UpdateCotizacionDto }>()
);

export const updateCotizacionSuccess = createAction(
  '[Cotizaciones] Update Cotizacion Success',
  props<{ cotizacion: Cotizacion }>()
);

export const updateCotizacionFailure = createAction(
  '[Cotizaciones] Update Cotizacion Failure',
  props<{ error: string }>()
);

// Eliminar cotización
export const deleteCotizacion = createAction(
  '[Cotizaciones] Delete Cotizacion',
  props<{ id: number }>()
);

export const deleteCotizacionSuccess = createAction(
  '[Cotizaciones] Delete Cotizacion Success',
  props<{ id: number }>()
);

export const deleteCotizacionFailure = createAction(
  '[Cotizaciones] Delete Cotizacion Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetCotizacionesState = createAction('[Cotizaciones] Reset State');
