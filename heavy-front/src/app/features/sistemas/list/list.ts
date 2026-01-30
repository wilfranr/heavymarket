import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
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
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, CardModule, InputTextModule, ToastModule, ConfirmDialogModule, FormsModule, TooltipModule],
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

    ngOnInit(): void {
        this.sistemas$ = this.store.select(selectAllSistemas);
        this.loading$ = this.store.select(selectSistemasLoading);
        this.pagination$ = this.store.select(selectSistemasPagination);

        this.cargarSistemas();
    }

    /**
     * Carga los sistemas desde el store
     */
    cargarSistemas(): void {
        this.store.dispatch(
            loadSistemas({
                page: this.currentPage,
                per_page: this.rowsPerPage,
                search: this.searchTerm || undefined
            })
        );
    }

    /**
     * Maneja el cambio de página
     */
    onPageChange(event: any): void {
        this.first = event.first;
        this.currentPage = event.page + 1;
        this.rowsPerPage = event.rows;
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
        this.router.navigate(['/app/sistemas/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(sistema: Sistema): void {
        this.router.navigate(['/app/sistemas', sistema.id]);
    }

    /**
     * Navega a editar
     */
    editarSistema(sistema: Sistema): void {
        this.router.navigate(['/app/sistemas', sistema.id, 'edit']);
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
