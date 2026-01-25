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

import { Sistema } from '../../../core/models/sistema.model';
import { loadSistemas, deleteSistema } from '../../../store/sistemas/actions/sistemas.actions';
import { selectAllSistemas, selectSistemasLoading, selectSistemasPagination } from '../../../store/sistemas/selectors/sistemas.selectors';

/**
 * Componente de lista de Sistemas
 */
@Component({
    selector: 'app-sistemas-list',
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

    sistemas$!: Observable<Sistema[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';
    private searchSubject = new Subject<string>();

    ngOnInit(): void {
        this.sistemas$ = this.store.select(selectAllSistemas);
        this.loading$ = this.store.select(selectSistemasLoading);
        this.pagination$ = this.store.select(selectSistemasPagination);

        // Configurar búsqueda con debounce
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchTerm = query;
            this.currentPage = 1;
            this.first = 0;
            this.cargarSistemas();
        });

        this.cargarSistemas();
    }

    /**
     * Maneja la búsqueda global
     */
    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Carga los sistemas desde el store
     */
    cargarSistemas(): void {
        this.store.dispatch(loadSistemas({
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
        this.rowsPerPage = event.rows;
        this.currentPage = Math.floor(event.first / event.rows) + 1;
        this.cargarSistemas();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        this.cargarSistemas();
    }

    /**
     * Navega a crear nuevo sistema
     */
    crearSistema(): void {
        this.router.navigate(['/sistemas/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(sistema: Sistema): void {
        this.router.navigate(['/sistemas', sistema.id]);
    }

    /**
     * Navega a editar
     */
    editarSistema(sistema: Sistema): void {
        this.router.navigate(['/sistemas', sistema.id, 'edit']);
    }

    /**
     * Elimina un sistema
     */
    eliminarSistema(sistema: Sistema): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el sistema "${sistema.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteSistema({ id: sistema.id }));

                setTimeout(() => {
                    this.cargarSistemas();
                }, 500);
            }
        });
    }
}
