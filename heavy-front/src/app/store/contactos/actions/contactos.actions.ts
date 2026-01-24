import { createAction, props } from '@ngrx/store';
import { Contacto, CreateContactoDto, UpdateContactoDto } from '../../../core/models/contacto.model';

/**
 * Acciones para el módulo de Contactos
 */

// Cargar contactos
export const loadContactos = createAction(
  '[Contactos] Load Contactos',
  props<{ page?: number; per_page?: number; search?: string; tercero_id?: number }>()
);

export const loadContactosSuccess = createAction(
  '[Contactos] Load Contactos Success',
  props<{ contactos: Contacto[]; total: number; currentPage: number; lastPage: number }>()
);

export const loadContactosFailure = createAction(
  '[Contactos] Load Contactos Failure',
  props<{ error: string }>()
);

// Cargar contacto por ID
export const loadContactoById = createAction(
  '[Contactos] Load Contacto By Id',
  props<{ id: number }>()
);

export const loadContactoByIdSuccess = createAction(
  '[Contactos] Load Contacto By Id Success',
  props<{ contacto: Contacto }>()
);

export const loadContactoByIdFailure = createAction(
  '[Contactos] Load Contacto By Id Failure',
  props<{ error: string }>()
);

// Crear contacto
export const createContacto = createAction(
  '[Contactos] Create Contacto',
  props<{ data: CreateContactoDto }>()
);

export const createContactoSuccess = createAction(
  '[Contactos] Create Contacto Success',
  props<{ contacto: Contacto }>()
);

export const createContactoFailure = createAction(
  '[Contactos] Create Contacto Failure',
  props<{ error: string }>()
);

// Actualizar contacto
export const updateContacto = createAction(
  '[Contactos] Update Contacto',
  props<{ id: number; data: UpdateContactoDto }>()
);

export const updateContactoSuccess = createAction(
  '[Contactos] Update Contacto Success',
  props<{ contacto: Contacto }>()
);

export const updateContactoFailure = createAction(
  '[Contactos] Update Contacto Failure',
  props<{ error: string }>()
);

// Eliminar contacto
export const deleteContacto = createAction(
  '[Contactos] Delete Contacto',
  props<{ id: number }>()
);

export const deleteContactoSuccess = createAction(
  '[Contactos] Delete Contacto Success',
  props<{ id: number }>()
);

export const deleteContactoFailure = createAction(
  '[Contactos] Delete Contacto Failure',
  props<{ error: string }>()
);

// Resetear estado
export const resetContactosState = createAction('[Contactos] Reset State');
