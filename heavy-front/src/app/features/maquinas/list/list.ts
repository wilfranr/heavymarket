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

import { Maquina } from '../../../core/models/maquina.model';
import { loadMaquinas, deleteMaquina } from '../../../store/maquinas/actions/maquinas.actions';
import { selectAllMaquinas, selectMaquinasLoading, selectMaquinasPagination } from '../../../store/maquinas/selectors/maquinas.selectors';
import { ListaService } from '../../../core/services/lista.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { Lista } from '../../../core/models/lista.model';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de lista de Máquinas
 */
@Component({
    selector: 'app-maquinas-list',
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
    private readonly fabricanteService = inject(FabricanteService);

    maquinas$!: Observable<Maquina[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';
    selectedFabricanteId: number | null = null;
    selectedTipoId: number | null = null;
    tipos: Lista[] = [];
    fabricantes: Fabricante[] = [];
    private searchSubject = new Subject<string>();

    ngOnInit(): void {
        this.maquinas$ = this.store.select(selectAllMaquinas);
        this.loading$ = this.store.select(selectMaquinasLoading);
        this.pagination$ = this.store.select(selectMaquinasPagination);

        // Configurar búsqueda con debounce
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchTerm = query;
            this.currentPage = 1;
            this.first = 0;
            this.cargarMaquinas();
        });

        this.cargarTipos();
        this.cargarFabricantes();
        this.cargarMaquinas();
    }

    /**
     * Maneja la búsqueda global
     */
    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Carga los tipos de máquina disponibles
     */
    cargarTipos(): void {
        this.listaService.getByTipo('Tipo de Máquina').subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
    }

    /**
     * Carga los fabricantes disponibles
     */
    cargarFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data;
            },
            error: (error) => {
                console.error('Error al cargar fabricantes:', error);
            }
        });
    }

    /**
     * Carga las máquinas desde el store
     */
    cargarMaquinas(): void {
        this.store.dispatch(loadMaquinas({
            page: this.currentPage,
            per_page: this.rowsPerPage,
            search: this.searchTerm || undefined,
            fabricante_id: this.selectedFabricanteId || undefined,
            tipo: this.selectedTipoId || undefined
        }));
    }

    /**
     * Maneja el cambio de filtro
     */
    onFilterChange(): void {
        this.currentPage = 1;
        this.first = 0;
        this.cargarMaquinas();
    }

    /**
     * Maneja el cambio de página
     */
    onPageChange(event: any): void {
        this.first = event.first;
        this.currentPage = event.page + 1;
        this.rowsPerPage = event.rows;
        this.cargarMaquinas();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        this.cargarMaquinas();
    }

    /**
     * Navega a crear nueva máquina
     */
    crearMaquina(): void {
        this.router.navigate(['/maquinas/create']);
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(maquina: Maquina): void {
        this.router.navigate(['/maquinas', maquina.id]);
    }

    /**
     * Navega a editar
     */
    editarMaquina(maquina: Maquina): void {
        this.router.navigate(['/maquinas', maquina.id, 'edit']);
    }

    /**
     * Elimina una máquina
     */
    eliminarMaquina(maquina: Maquina): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la máquina "${maquina.modelo}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteMaquina({ id: maquina.id }));

                setTimeout(() => {
                    this.cargarMaquinas();
                }, 500);
            }
        });
    }
}
