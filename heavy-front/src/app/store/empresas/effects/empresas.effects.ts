import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EmpresaService } from '../../../core/services/empresa.service';
import { MessageService } from 'primeng/api';
import * as EmpresasActions from '../actions/empresas.actions';

/**
 * Effects para el módulo de Empresas
 */
@Injectable()
export class EmpresasEffects {
  private actions$ = inject(Actions);
  private empresaService = inject(EmpresaService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  /**
   * Effect para cargar empresas
   */
  loadEmpresas$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmpresasActions.loadEmpresas),
      switchMap(({ estado, country_id, city_id, page, per_page }) =>
        this.empresaService.getAll({ estado, country_id, city_id, page, per_page }).pipe(
          map((response) => {
            return EmpresasActions.loadEmpresasSuccess({
              empresas: response.data,
              total: response.meta.total,
              currentPage: response.meta.current_page,
              lastPage: response.meta.last_page,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar las empresas';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(EmpresasActions.loadEmpresasFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para cargar empresa por ID
   */
  loadEmpresaById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmpresasActions.loadEmpresaById),
      switchMap(({ id }) =>
        this.empresaService.getById(id).pipe(
          map((response) => {
            return EmpresasActions.loadEmpresaByIdSuccess({
              empresa: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al cargar la empresa';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(EmpresasActions.loadEmpresaByIdFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para crear empresa
   */
  createEmpresa$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmpresasActions.createEmpresa),
      switchMap(({ data }) =>
        this.empresaService.create(data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Empresa creada exitosamente',
            });
            return EmpresasActions.createEmpresaSuccess({
              empresa: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al crear la empresa';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(EmpresasActions.createEmpresaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para actualizar empresa
   */
  updateEmpresa$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmpresasActions.updateEmpresa),
      switchMap(({ id, data }) =>
        this.empresaService.update(id, data).pipe(
          map((response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Empresa actualizada exitosamente',
            });
            return EmpresasActions.updateEmpresaSuccess({
              empresa: response.data,
            });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al actualizar la empresa';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(EmpresasActions.updateEmpresaFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Effect para eliminar empresa
   */
  deleteEmpresa$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmpresasActions.deleteEmpresa),
      switchMap(({ id }) =>
        this.empresaService.deleteEmpresa(id).pipe(
          map(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Empresa eliminada exitosamente',
            });
            return EmpresasActions.deleteEmpresaSuccess({ id });
          }),
          catchError((error) => {
            const message = error.error?.message || 'Error al eliminar la empresa';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: message,
            });
            return of(EmpresasActions.deleteEmpresaFailure({ error: message }));
          })
        )
      )
    )
  );
}
