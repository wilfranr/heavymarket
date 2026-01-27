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

import { Fabricante } from '../../../core/models/fabricante.model';
import { loadFabricantes, deleteFabricante } from '../../../store/fabricantes/actions/fabricantes.actions';
import { selectAllFabricantes, selectFabricantesLoading, selectFabricantesPagination } from '../../../store/fabricantes/selectors/fabricantes.selectors';

/**
 * Componente de lista de Fabricantes
 */
@Component({
    selector: 'app-fabricantes-list',
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

    fabricantes$!: Observable<Fabricante[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';

    ngOnInit(): void {
        this.fabricantes$ = this.store.select(selectAllFabricantes);
        this.loading$ = this.store.select(selectFabricantesLoading);
        this.pagination$ = this.store.select(selectFabricantesPagination);

        this.cargarFabricantes();
    }

    /**
     * Carga los fabricantes desde el store
     */
    cargarFabricantes(): void {
        this.store.dispatch(loadFabricantes({
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
        this.cargarFabricantes();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        // El ordenamiento se maneja en el backend
        this.cargarFabricantes();
    }

    /**
     * Navega a crear nuevo fabricante
     */
    crearFabricante(): void {
        this.router.navigate(['/fabricantes/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(fabricante: Fabricante): void {
        this.router.navigate(['/fabricantes', fabricante.id]);
    }

    /**
     * Navega a editar
     */
    editarFabricante(fabricante: Fabricante): void {
        this.router.navigate(['/fabricantes', fabricante.id, 'edit']);
    }

    /**
     * Elimina un fabricante
     */
    eliminarFabricante(fabricante: Fabricante): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el fabricante "${fabricante.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteFabricante({ id: fabricante.id }));
                
                // Recargar después de eliminar
                setTimeout(() => {
                    this.cargarFabricantes();
                }, 500);
            }
        });
    }
}
