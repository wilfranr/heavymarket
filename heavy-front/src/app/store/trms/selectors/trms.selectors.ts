import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TRMsState, adapter } from '../reducers/trms.reducer';

/**
 * Selector del feature de TRM
 */
export const selectTRMsState = createFeatureSelector<TRMsState>('trms');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectTRMsState);

export const selectAllTRMs = selectAll;
export const selectTRMsEntities = selectEntities;
export const selectTRMsIds = selectIds;
export const selectTRMsTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectTRMsLoading = createSelector(
  selectTRMsState,
  (state: TRMsState) => state.loading
);

/**
 * Selector de error
 */
export const selectTRMsError = createSelector(
  selectTRMsState,
  (state: TRMsState) => state.error
);

/**
 * Selector de paginación
 */
export const selectTRMsPagination = createSelector(selectTRMsState, (state: TRMsState) => ({
  total: state.total,
  currentPage: state.currentPage,
  lastPage: state.lastPage,
}));

/**
 * Selector de TRM más reciente
 */
export const selectLatestTRM = createSelector(
  selectTRMsState,
  (state: TRMsState) => state.latestTRM
);

/**
 * Selector de TRM por ID
 */
export const selectTRMById = (id: number) =>
  createSelector(selectTRMsEntities, (entities) => entities[id] || null);
