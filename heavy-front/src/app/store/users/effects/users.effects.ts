import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { UsersActions } from '../actions/users.actions';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      mergeMap(({ page, search }) =>
        this.userService.getUsers(page, search).pipe(
          map(paginated => UsersActions.loadUsersSuccess({ paginated })),
          catchError(error => of(UsersActions.loadUsersFailure({ error })))
        )
      )
    )
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      mergeMap(({ user }) =>
        this.userService.createUser(user).pipe(
          map(response => UsersActions.createUserSuccess({ user: response.data })),
          catchError(error => of(UsersActions.createUserFailure({ error })))
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      mergeMap(({ id, user }) =>
        this.userService.updateUser(id, user).pipe(
          map(response => UsersActions.updateUserSuccess({ user: response.data })),
          catchError(error => of(UsersActions.updateUserFailure({ error })))
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deleteUser),
      mergeMap(({ id }) =>
        this.userService.deleteUser(id).pipe(
          map(() => UsersActions.deleteUserSuccess({ id })),
          catchError(error => of(UsersActions.deleteUserFailure({ error })))
        )
      )
    )
  );
}
