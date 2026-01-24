import { createAction, props } from '@ngrx/store';
import { Empresa, CreateEmpresaDto, UpdateEmpresaDto } from '../../../core/models/empresa.model';

/**
 * Acciones para el módulo de Empresas
 */

// Cargar empresas
export const loadEmpresas = createAction(
  '[Empresas] Load Empresas',
  props<{ estado?: boolean; country_id?: number; city_id?: number; page?: number; per_page?: number }>()
);

export const loadEmpresasSuccess = createAction(
  '[Empresas] Load Empresas Success',
  props<{ empresas: Empresa[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadEmpresasFailure = createAction(
  '[Empresas] Load Empresas Failure',
  props<{ error: string }>()
);

// Cargar empresa por ID
export const loadEmpresaById = createAction(
  '[Empresas] Load Empresa By Id',
  props<{ id: number }>()
);

export const loadEmpresaByIdSuccess = createAction(
  '[Empresas] Load Empresa By Id Success',
  props<{ empresa: Empresa }>()
);

export const loadEmpresaByIdFailure = createAction(
  '[Empresas] Load Empresa By Id Failure',
  props<{ error: string }>()
);

// Crear empresa
export const createEmpresa = createAction(
  '[Empresas] Create Empresa',
  props<{ data: CreateEmpresaDto }>()
);

export const createEmpresaSuccess = createAction(
  '[Empresas] Create Empresa Success',
  props<{ empresa: Empresa }>()
);

export const createEmpresaFailure = createAction(
  '[Empresas] Create Empresa Failure',
  props<{ error: string }>()
);

// Actualizar empresa
export const updateEmpresa = createAction(
  '[Empresas] Update Empresa',
  props<{ id: number; data: UpdateEmpresaDto }>()
);

export const updateEmpresaSuccess = createAction(
  '[Empresas] Update Empresa Success',
  props<{ empresa: Empresa }>()
);

export const updateEmpresaFailure = createAction(
  '[Empresas] Update Empresa Failure',
  props<{ error: string }>()
);

// Eliminar empresa
export const deleteEmpresa = createAction(
  '[Empresas] Delete Empresa',
  props<{ id: number }>()
);

export const deleteEmpresaSuccess = createAction(
  '[Empresas] Delete Empresa Success',
  props<{ id: number }>()
);

export const deleteEmpresaFailure = createAction(
  '[Empresas] Delete Empresa Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetEmpresasState = createAction('[Empresas] Reset State');
