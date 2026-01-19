import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ListasState, adapter } from '../reducers/listas.reducer';
import { ListaTipo } from '../../../core/models/lista.model';

/**
 * Selector del feature de listas
 */
export const selectListasState = createFeatureSelector<ListasState>('listas');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();

export const selectAllListas = selectAll;
export const selectListasEntities = selectEntities;
export const selectListasIds = selectIds;
export const selectListasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectListasLoading = createSelector(
  selectListasState,
  (state: ListasState) => state.loading
);

/**
 * Selector de error
 */
export const selectListasError = createSelector(
  selectListasState,
  (state: ListasState) => state.error
);

/**
 * Selector de paginación
 */
export const selectListasPagination = createSelector(
  selectListasState,
  (state: ListasState) => ({
    total: state.total,
    currentPage: state.currentPage,
    lastPage: state.lastPage,
  })
);

/**
 * Selector de lista por ID
 */
export const selectListaById = (id: number) =>
  createSelector(
    selectListasEntities,
    (entities) => entities[id] || null
  );

/**
 * Selector de listas por tipo
 */
export const selectListasByTipo = (tipo: ListaTipo) =>
  createSelector(
    selectListasState,
    (state: ListasState) => state.listasByTipo[tipo] || []
  );

/**
 * Selector de listas filtradas por tipo
 */
export const selectListasByTipoFilter = (tipo: ListaTipo) =>
  createSelector(
    selectAllListas,
    (listas) => listas.filter((lista) => lista.tipo === tipo)
  );
