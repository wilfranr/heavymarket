import { createFeature, createReducer, on } from '@ngrx/store';
import { User } from '../../../core/auth/models/user.model';
import { UsersActions } from '../actions/users.actions';

export interface UsersState {
  users: User[];
  total: number;
  currentPage: number;
  loading: boolean;
  error: any | null;
}

export const initialUsersState: UsersState = {
  users: [],
  total: 0,
  currentPage: 1,
  loading: false,
  error: null
};

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialUsersState,
    
    on(UsersActions.loadUsers, state => ({ ...state, loading: true, error: null })),
    on(UsersActions.loadUsersSuccess, (state, { paginated }) => ({
      ...state,
      users: paginated.data,
      total: paginated.meta.total,
      currentPage: paginated.meta.current_page,
      loading: false
    })),
    on(UsersActions.loadUsersFailure, (state, { error }) => ({ ...state, loading: false, error })),
    
    on(UsersActions.createUser, state => ({ ...state, loading: true, error: null })),
    on(UsersActions.createUserSuccess, (state, { user }) => ({
      ...state,
      users: [user, ...state.users],
      loading: false
    })),
    on(UsersActions.createUserFailure, (state, { error }) => ({ ...state, loading: false, error })),
    
    on(UsersActions.updateUser, state => ({ ...state, loading: true, error: null })),
    on(UsersActions.updateUserSuccess, (state, { user }) => ({
      ...state,
      users: state.users.map(u => u.id === user.id ? user : u),
      loading: false
    })),
    on(UsersActions.updateUserFailure, (state, { error }) => ({ ...state, loading: false, error })),
    
    on(UsersActions.deleteUser, state => ({ ...state, loading: true, error: null })),
    on(UsersActions.deleteUserSuccess, (state, { id }) => ({
      ...state,
      users: state.users.filter(u => u.id !== id),
      total: state.total - 1,
      loading: false
    })),
    on(UsersActions.deleteUserFailure, (state, { error }) => ({ ...state, loading: false, error }))
  )
});

export const usersReducer = usersFeature.reducer;
