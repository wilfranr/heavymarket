import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../../core/auth/models/user.model';
import { PaginatedUsers } from '../../../core/services/user.service';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Users': props<{ page: number; search: string }>(),
    'Load Users Success': props<{ paginated: PaginatedUsers }>(),
    'Load Users Failure': props<{ error: any }>(),
    
    'Create User': props<{ user: Partial<User> & { password?: string, roles?: string[] } }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: any }>(),

    'Update User': props<{ id: number; user: Partial<User> & { password?: string, roles?: string[] } }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: any }>(),

    'Delete User': props<{ id: number }>(),
    'Delete User Success': props<{ id: number }>(),
    'Delete User Failure': props<{ error: any }>(),
  }
});
