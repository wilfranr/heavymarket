import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

import { Articulo } from '../../../core/models/articulo.model';
import { loadArticulos, deleteArticulo } from '../../../store/articulos/actions/articulos.actions';
import { selectAllArticulos, selectArticulosLoading, selectArticulosPagination } from '../../../store/articulos/selectors/articulos.selectors';

/**
 * Componente de lista de Artículos
 */
@Component({
    selector: 'app-articulos-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, ToolbarModule, IconFieldModule, InputIconModule, CardModule, InputTextModule, ToastModule, ConfirmDialogModule, FormsModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './list.html'
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    articulos$!: Observable<Articulo[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';
    private searchSubject = new Subject<string>();

    ngOnInit(): void {
        this.articulos$ = this.store.select(selectAllArticulos);
        this.loading$ = this.store.select(selectArticulosLoading);
        this.pagination$ = this.store.select(selectArticulosPagination);

        // Configurar búsqueda con debounce
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchTerm = query;
            this.currentPage = 1;
            this.first = 0;
            this.cargarArticulos();
        });

        this.cargarArticulos();
    }

    /**
     * Maneja la búsqueda global
     */
    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Carga los artículos desde el store
     */
    cargarArticulos(): void {
        this.store.dispatch(loadArticulos({
            page: this.currentPage,
            per_page: this.rowsPerPage,
            search: this.searchTerm || undefined
        }));
    }

    /**
     * Maneja el cambio de página
     */
    onPageChange(event: any): void {
        this.first = event.first;
        this.currentPage = event.page + 1;
        this.rowsPerPage = event.rows;
        this.cargarArticulos();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        this.cargarArticulos();
    }

    /**
     * Navega a crear nuevo artículo
     */
    crearArticulo(): void {
        this.router.navigate(['/articulos/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(articulo: Articulo): void {
        this.router.navigate(['/articulos', articulo.id]);
    }

    /**
     * Navega a editar
     */
    editarArticulo(articulo: Articulo): void {
        this.router.navigate(['/articulos', articulo.id, 'edit']);
    }

    /**
     * Elimina un artículo
     */
    eliminarArticulo(articulo: Articulo): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el artículo "${articulo.descripcionEspecifica}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteArticulo({ id: articulo.id }));

                setTimeout(() => {
                    this.cargarArticulos();
                }, 500);
            }
        });
    }
}
