import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ContactoService } from '../../../core/services/contacto.service';
import { MessageService } from 'primeng/api';
import * as ContactosActions from '../actions/contactos.actions';

/**
 * Effects para el módulo de Contactos
 */
@Injectable()
export class ContactosEffects {
  private actions$ = inject(Actions);
  private contactoService = inject(ContactoService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar contactos
   */
  loadContactos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactosActions.loadContactos),
      switchMap(({ page, per_page, search, tercero_id }) =>
        this.contactoService.getAll({ page, per_page, search, tercero_id }).pipe(
          map((response) => {
            return ContactosActions.loadContactosSuccess({
              contactos: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar los contactos';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(ContactosActions.loadContactosFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar contacto por ID
   */
  loadContactoById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactosActions.loadContactoById),
      switchMap(({ id }) =>
        this.contactoService.getById(id).pipe(
          map((response) => {
            return ContactosActions.loadContactoByIdSuccess({
              contacto: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar el contacto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(ContactosActions.loadContactoByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear contacto
   */
  createContacto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactosActions.createContacto),
      switchMap(({ data }) =>
        this.contactoService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Contacto creado exitosamente',
            });
            return ContactosActions.createContactoSuccess({
              contacto: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear el contacto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(ContactosActions.createContactoFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar contacto
   */
  updateContacto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactosActions.updateContacto),
      switchMap(({ id, data }) =>
        this.contactoService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Contacto actualizado exitosamente',
            });
            return ContactosActions.updateContactoSuccess({
              contacto: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar el contacto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(ContactosActions.updateContactoFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar contacto
   */
  deleteContacto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContactosActions.deleteContacto),
      switchMap(({ id }) =>
        this.contactoService.deleteContacto(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Contacto eliminado exitosamente',
            });
            return ContactosActions.deleteContactoSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar el contacto';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(ContactosActions.deleteContactoFailure({ error: message }));
          })
        )
      )
    )
  );
}
