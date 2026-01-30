import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CategoriaService } from '../../../core/services/categoria.service';
import { MessageService } from 'primeng/api';
import * as CategoriasActions from '../actions/categorias.actions';

/**
 * Effects para el módulo de Categorías
 */
@Injectable()
export class CategoriasEffects {
    private actions$ = inject(Actions);
    private categoriaService = inject(CategoriaService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    /**
     * Effect para cargar categorías
     */
    loadCategorias$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CategoriasActions.loadCategorias),
            switchMap(({ page, per_page, search }) =>
                this.categoriaService.getAll({ page, per_page, search }).pipe(
                    map((response) => {
                        return CategoriasActions.loadCategoriasSuccess({
                            categorias: response.data,
                            total: response.meta.total,
                            currentPage: response.meta.current_page,
                            lastPage: response.meta.last_page
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar las categorías';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CategoriasActions.loadCategoriasFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para cargar categoría por ID
     */
    loadCategoriaById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CategoriasActions.loadCategoriaById),
            switchMap(({ id }) =>
                this.categoriaService.getById(id).pipe(
                    map((response) => {
                        return CategoriasActions.loadCategoriaByIdSuccess({
                            categoria: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al cargar la categoría';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CategoriasActions.loadCategoriaByIdFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para crear categoría
     */
    createCategoria$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CategoriasActions.createCategoria),
            switchMap(({ data }) =>
                this.categoriaService.create(data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Categoría creada exitosamente'
                        });
                        return CategoriasActions.createCategoriaSuccess({
                            categoria: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al crear la categoría';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CategoriasActions.createCategoriaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para actualizar categoría
     */
    updateCategoria$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CategoriasActions.updateCategoria),
            switchMap(({ id, data }) =>
                this.categoriaService.update(id, data).pipe(
                    map((response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Categoría actualizada exitosamente'
                        });
                        return CategoriasActions.updateCategoriaSuccess({
                            categoria: response.data
                        });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al actualizar la categoría';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CategoriasActions.updateCategoriaFailure({ error: message }));
                    })
                )
            )
        )
    );

    /**
     * Effect para eliminar categoría
     */
    deleteCategoria$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CategoriasActions.deleteCategoria),
            switchMap(({ id }) =>
                this.categoriaService.deleteCategoria(id).pipe(
                    map(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Categoría eliminada exitosamente'
                        });
                        return CategoriasActions.deleteCategoriaSuccess({ id });
                    }),
                    catchError((error) => {
                        const message = error.error?.message || 'Error al eliminar la categoría';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: message
                        });
                        return of(CategoriasActions.deleteCategoriaFailure({ error: message }));
                    })
                )
            )
        )
    );
}
