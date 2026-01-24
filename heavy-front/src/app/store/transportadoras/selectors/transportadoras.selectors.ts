import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TransportadorasState, adapter } from '../reducers/transportadoras.reducer';

/**
 * Selector del feature de transportadoras
 */
export const selectTransportadorasState = createFeatureSelector<TransportadorasState>('transportadoras');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectTransportadorasState);

export const selectAllTransportadoras = selectAll;
export const selectTransportadorasEntities = selectEntities;
export const selectTransportadorasIds = selectIds;
export const selectTransportadorasTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectTransportadorasLoading = createSelector(
  selectTransportadorasState,
  (state: TransportadorasState) => state.loading
);

/**
 * Selector de error
 */
export const selectTransportadorasError = createSelector(
  selectTransportadorasState,
  (state: TransportadorasState) => state.error
);

/**
 * Selector de paginación
 */
export const selectTransportadorasPagination = createSelector(selectTransportadorasState, (state: TransportadorasState) => ({
  total: state.total,
  currentPage: state.currentPage,
  lastPage: state.lastPage,
}));

/**
 * Selector de transportadora por ID
 */
export const selectTransportadoraById = (id: number) =>
  createSelector(selectTransportadorasEntities, (entities) => entities[id] || null);
