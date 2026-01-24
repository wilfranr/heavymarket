import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Empresa } from '../../../core/models/empresa.model';
import * as EmpresasActions from '../actions/empresas.actions';

/**
 * Estado de las empresas usando EntityAdapter para mejor gestión
 */
export interface EmpresasState extends EntityState<Empresa> {
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  lastPage: number;
}

export const adapter: EntityAdapter<Empresa> = createEntityAdapter<Empresa>({
  selectId: (empresa: Empresa) => empresa.id,
  sortComparer: (a: Empresa, b: Empresa) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
});

const initialState: EmpresasState = adapter.getInitialState({
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
});

export const empresasReducer = createReducer(
  initialState,

  // Cargar empresas
  on(EmpresasActions.loadEmpresas, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmpresasActions.loadEmpresasSuccess, (state, { empresas, total, currentPage, lastPage }) => {
    return adapter.setAll(empresas, {
      ...state,
      loading: false,
      error: null,
      total,
      currentPage,
      lastPage,
    });
  }),

  on(EmpresasActions.loadEmpresasFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Cargar empresa por ID
  on(EmpresasActions.loadEmpresaById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmpresasActions.loadEmpresaByIdSuccess, (state, { empresa }) => {
    return adapter.upsertOne(empresa, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(EmpresasActions.loadEmpresaByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Crear empresa
  on(EmpresasActions.createEmpresa, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmpresasActions.createEmpresaSuccess, (state, { empresa }) => {
    return adapter.addOne(empresa, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(EmpresasActions.createEmpresaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Actualizar empresa
  on(EmpresasActions.updateEmpresa, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmpresasActions.updateEmpresaSuccess, (state, { empresa }) => {
    return adapter.updateOne(
      { id: empresa.id, changes: empresa },
      {
        ...state,
        loading: false,
        error: null,
      }
    );
  }),

  on(EmpresasActions.updateEmpresaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Eliminar empresa
  on(EmpresasActions.deleteEmpresa, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmpresasActions.deleteEmpresaSuccess, (state, { id }) => {
    return adapter.removeOne(id, {
      ...state,
      loading: false,
      error: null,
    });
  }),

  on(EmpresasActions.deleteEmpresaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Resetear estado
  on(EmpresasActions.resetEmpresasState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
