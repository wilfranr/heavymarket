import { createSelector } from '@ngrx/store';
import { usersFeature } from '../reducers/users.reducer';

export const {
  selectUsersState,
  selectUsers,
  selectTotal,
  selectCurrentPage,
  selectLoading,
  selectError,
} = usersFeature;
