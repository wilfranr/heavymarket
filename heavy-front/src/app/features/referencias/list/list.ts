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
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

import { Referencia } from '../../../core/models/referencia.model';
import { loadReferencias, deleteReferencia } from '../../../store/referencias/actions/referencias.actions';
import { selectAllReferencias, selectReferenciasLoading, selectReferenciasPagination } from '../../../store/referencias/selectors/referencias.selectors';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';

/**
 * Componente de lista de Referencias
 */
@Component({
    selector: 'app-referencias-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, ToolbarModule, IconFieldModule, InputIconModule, CardModule, InputTextModule, ToastModule, ConfirmDialogModule, SelectModule, FormsModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './list.html'
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly listaService = inject(ListaService);

    referencias$!: Observable<Referencia[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';
    selectedMarcaId: number | null = null;
    marcas: Lista[] = [];
    private searchSubject = new Subject<string>();

    ngOnInit(): void {
        this.referencias$ = this.store.select(selectAllReferencias);
        this.loading$ = this.store.select(selectReferenciasLoading);
        this.pagination$ = this.store.select(selectReferenciasPagination);

        // Configurar búsqueda con debounce
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchTerm = query;
            this.currentPage = 1;
            this.first = 0;
            this.cargarReferencias();
        });

        this.cargarMarcas();
        this.cargarReferencias();
    }

    /**
     * Maneja la búsqueda global
     */
    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Carga las marcas disponibles
     */
    cargarMarcas(): void {
        this.listaService.getByTipo('Marca').subscribe({
            next: (marcas) => {
                this.marcas = marcas;
            },
            error: (error) => {
                console.error('Error al cargar marcas:', error);
            }
        });
    }

    /**
     * Carga las referencias desde el store
     */
    cargarReferencias(): void {
        this.store.dispatch(loadReferencias({
            page: this.currentPage,
            per_page: this.rowsPerPage,
            search: this.searchTerm || undefined,
            marca_id: this.selectedMarcaId || undefined
        }));
    }

    /**
     * Maneja el cambio de filtro por marca
     */
    onMarcaChange(): void {
        this.currentPage = 1;
        this.first = 0;
        this.cargarReferencias();
    }

    /**
     * Maneja el cambio de página
     */
    onPageChange(event: any): void {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.currentPage = Math.floor(event.first / event.rows) + 1;
        this.cargarReferencias();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        this.cargarReferencias();
    }

    /**
     * Navega a crear nueva referencia
     */
    crearReferencia(): void {
        this.router.navigate(['/referencias/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(referencia: Referencia): void {
        this.router.navigate(['/referencias', referencia.id]);
    }

    /**
     * Navega a editar
     */
    editarReferencia(referencia: Referencia): void {
        this.router.navigate(['/referencias', referencia.id, 'edit']);
    }

    /**
     * Elimina una referencia
     */
    eliminarReferencia(referencia: Referencia): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la referencia "${referencia.referencia}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteReferencia({ id: referencia.id }));

                setTimeout(() => {
                    this.cargarReferencias();
                }, 500);
            }
        });
    }
}
