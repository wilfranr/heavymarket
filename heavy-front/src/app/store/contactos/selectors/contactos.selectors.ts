import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ContactosState, adapter } from '../reducers/contactos.reducer';

/**
 * Selector del feature de contactos
 */
export const selectContactosState = createFeatureSelector<ContactosState>('contactos');

/**
 * Selectores usando EntityAdapter
 */
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectContactosState);

export const selectAllContactos = selectAll;
export const selectContactosEntities = selectEntities;
export const selectContactosIds = selectIds;
export const selectContactosTotal = selectTotal;

/**
 * Selector de loading
 */
export const selectContactosLoading = createSelector(
  selectContactosState,
  (state: ContactosState) => state.loading
);

/**
 * Selector de error
 */
export const selectContactosError = createSelector(
  selectContactosState,
  (state: ContactosState) => state.error
);

/**
 * Selector de paginación
 */
export const selectContactosPagination = createSelector(selectContactosState, (state: ContactosState) => ({
  total: state.total,
  currentPage: state.currentPage,
  lastPage: state.lastPage,
}));

/**
 * Selector de contacto por ID
 */
export const selectContactoById = (id: number) =>
  createSelector(selectContactosEntities, (entities) => entities[id] || null);
