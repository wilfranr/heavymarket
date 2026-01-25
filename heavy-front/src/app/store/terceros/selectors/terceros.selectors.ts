import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TercerosState, tercerosAdapter } from '../reducers/terceros.reducer';

/**
 * Selector del estado de Terceros
 */
export const selectTercerosState = createFeatureSelector<TercerosState>('terceros');

/**
 * Selectores del adapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = tercerosAdapter.getSelectors();

/**
 * Selector para obtener el estado de carga
 */
export const selectTercerosLoading = createSelector(
    selectTercerosState,
    (state: TercerosState) => state.loading
);

/**
 * Selector para obtener errores
 */
export const selectTercerosError = createSelector(
    selectTercerosState,
    (state: TercerosState) => state.error
);

/**
 * Selector para obtener todos los terceros
 */
export const selectAllTerceros = createSelector(
    selectTercerosState,
    selectAll
);

/**
 * Selector para obtener las entidades de terceros
 */
export const selectTercerosEntities = createSelector(
    selectTercerosState,
    selectEntities
);

/**
 * Selector para obtener un tercero por ID
 */
export const selectTerceroById = (id: number) => createSelector(
    selectTercerosEntities,
    (entities) => entities[id]
);

/**
 * Selector para obtener el total de terceros (desde el meta del API)
 */
export const selectTercerosTotal = createSelector(
    selectTercerosState,
    (state: TercerosState) => state.total
);

/**
 * Selector de paginación
 */
export const selectTercerosPagination = createSelector(
    selectTercerosState,
    (state: TercerosState) => ({
        total: state.total,
        currentPage: state.currentPage,
        lastPage: state.lastPage
    })
);
