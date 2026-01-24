import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EmpresasState, adapter } from '../reducers/empresas.reducer';

/**
 * Selector del feature de empresas
 */
export const selectEmpresasState = createFeatureSelector<EmpresasState>('empresas');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectEmpresasState);

export const selectAllEmpresas = selectAll;
export const selectEmpresasEntities = selectEntities;
export const selectEmpresasIds = selectIds;
export const selectEmpresasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectEmpresasLoading = createSelector(
  selectEmpresasState,
  (state: EmpresasState) => state.loading
);

/**
 * Selector de error
 */
export const selectEmpresasError = createSelector(
  selectEmpresasState,
  (state: EmpresasState) => state.error
);

/**
 * Selector de paginación
 */
export const selectEmpresasPagination = createSelector(selectEmpresasState, (state: EmpresasState) => ({
  total: state.total,
  currentPage: state.currentPage,
  lastPage: state.lastPage,
}));

/**
 * Selector de empresa por ID
 */
export const selectEmpresaById = (id: number) =>
  createSelector(selectEmpresasEntities, (entities) => entities[id] || null);

/**
 * Selector de empresas activas
 */
export const selectEmpresasActivas = createSelector(selectAllEmpresas, (empresas) =>
  empresas.filter((empresa) => empresa.estado === true)
);
