import { createAction, props } from '@ngrx/store';
import { Tercero, CreateTerceroDto, UpdateTerceroDto } from '../../../core/models/tercero.model';

/**
 * Acciones para cargar terceros
 */
export const loadTerceros = createAction(
    '[Terceros] Load Terceros',
    props<{ params?: any }>()
);

export const loadTercerosSuccess = createAction(
    '[Terceros] Load Terceros Success',
    props<{ terceros: Tercero[] }>()
);

export const loadTercerosFailure = createAction(
    '[Terceros] Load Terceros Failure',
    props<{ error: any }>()
);

/**
 * Acciones para crear tercero
 */
export const createTercero = createAction(
    '[Terceros] Create Tercero',
    props<{ tercero: CreateTerceroDto }>()
);

export const createTerceroSuccess = createAction(
    '[Terceros] Create Tercero Success',
    props<{ tercero: Tercero }>()
);

export const createTerceroFailure = createAction(
    '[Terceros] Create Tercero Failure',
    props<{ error: any }>()
);

/**
 * Acciones para actualizar tercero
 */
export const updateTercero = createAction(
    '[Terceros] Update Tercero',
    props<{ id: number; tercero: UpdateTerceroDto }>()
);

export const updateTerceroSuccess = createAction(
    '[Terceros] Update Tercero Success',
    props<{ tercero: Tercero }>()
);

export const updateTerceroFailure = createAction(
    '[Terceros] Update Tercero Failure',
    props<{ error: any }>()
);

/**
 * Acciones para eliminar tercero
 */
export const deleteTercero = createAction(
    '[Terceros] Delete Tercero',
    props<{ id: number }>()
);

export const deleteTerceroSuccess = createAction(
    '[Terceros] Delete Tercero Success',
    props<{ id: number }>()
);

export const deleteTerceroFailure = createAction(
    '[Terceros] Delete Tercero Failure',
    props<{ error: any }>()
);
