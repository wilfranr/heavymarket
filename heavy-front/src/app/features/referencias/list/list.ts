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
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';

import { Referencia, UpdateReferenciaDto } from '../../../core/models/referencia.model';
import { loadReferencias, deleteReferencia, updateReferencia } from '../../../store/referencias/actions/referencias.actions';
import { selectAllReferencias, selectReferenciasLoading, selectReferenciasPagination } from '../../../store/referencias/selectors/referencias.selectors';
import { ListaService } from '../../../core/services/lista.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Lista } from '../../../core/models/lista.model';
import { Articulo } from '../../../core/models/articulo.model';
import { TextareaModule } from 'primeng/textarea';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';
import { RippleModule } from 'primeng/ripple';

/**
 * Componente de lista de Referencias
 */
@Component({
    selector: 'app-referencias-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, CardModule, InputTextModule, ToastModule, ConfirmDialogModule, SelectModule, FormsModule, TooltipModule, TextareaModule, ReferenciaCreateModalComponent, RippleModule, IconFieldModule, InputIconModule, TagModule, CheckboxModule],
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
    private readonly articuloService = inject(ArticuloService);

    referencias$!: Observable<Referencia[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación y Filtros
    currentPage = 1;
    rowsPerPage = 20;
    first = 0;
    searchTerm = '';
    selectedMarcaId: number | null = null;
    filterTemporales = false;
    sortBy = 'created_at';
    sortOrder: 'asc' | 'desc' = 'desc';

    marcas: Lista[] = [];
    articulos: Articulo[] = [];
    editingReferencias: { [s: string]: Referencia } = {};

    // Modal de creación
    showCreateModal = false;

    ngOnInit(): void {
        this.referencias$ = this.store.select(selectAllReferencias);
        this.loading$ = this.store.select(selectReferenciasLoading);
        this.pagination$ = this.store.select(selectReferenciasPagination);

        this.cargarMarcas();
        this.cargarArticulos();
        this.cargarReferencias();
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
     * Carga los artículos disponibles para asociar
     */
    cargarArticulos(): void {
        this.articuloService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                this.articulos = response.data;
            },
            error: (error) => {
                console.error('Error al cargar artículos:', error);
            }
        });
    }

    /**
     * Carga las referencias desde el store
     */
    cargarReferencias(): void {
        this.store.dispatch(
            loadReferencias({
                page: this.currentPage,
                per_page: this.rowsPerPage,
                search: this.searchTerm || undefined,
                marca_id: this.selectedMarcaId || undefined,
                es_temporal: this.filterTemporales || undefined,
                sort_by: this.sortBy,
                sort_order: this.sortOrder
            })
        );
    }

    /**
     * Maneja la carga perezosa (paginación, orden y filtros remotos)
     */
    onLazyLoad(event: any): void {
        this.first = event.first || 0;
        this.rowsPerPage = event.rows || 20;
        this.currentPage = Math.floor(this.first / this.rowsPerPage) + 1;

        if (event.globalFilter !== undefined) {
            this.searchTerm = event.globalFilter;
        }

        if (event.sortField) {
            this.sortBy = event.sortField;
            this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        }

        this.cargarReferencias();
    }

    /**
     * Maneja el cambio de filtro por marca
     */
    onMarcaChange(): void {
        this.first = 0;
        this.currentPage = 1;
        this.cargarReferencias();
    }

    /**
     * Maneja el cambio de filtro temporal
     */
    onTemporalChange(): void {
        this.first = 0;
        this.currentPage = 1;
        this.cargarReferencias();
    }

    /**
     * Muestra el modal para crear nueva referencia
     */
    crearReferencia(): void {
        this.showCreateModal = true;
    }

    /**
     * Maneja la creación exitosa desde el modal
     */
    onReferenciaCreada(): void {
        this.cargarReferencias();
    }

    /**
     * Navega a ver detalle
     */
    verDetalle(referencia: Referencia): void {
        this.router.navigate(['/app/referencias', referencia.id]);
    }

    /**
     * Navega a editar
     */
    editarReferencia(referencia: Referencia): void {
        this.router.navigate(['/app/referencias', referencia.id, 'edit']);
    }

    /**
     * Inicia la edición de una fila
     */
    onRowEditInit(referencia: Referencia) {
        this.editingReferencias[referencia.id] = { ...referencia };
    }

    /**
     * Guarda los cambios de la fila
     */
    onRowEditSave(referencia: Referencia) {
        const data: UpdateReferenciaDto = {
            referencia: referencia.referencia,
            marca_id: referencia.marca_id,
            articulo_id: referencia.articulo_id,
            comentario: referencia.comentario
        };

        this.store.dispatch(updateReferencia({ id: referencia.id, data }));
        delete this.editingReferencias[referencia.id];

        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Referencia actualizada correctamente'
        });

        setTimeout(() => this.cargarReferencias(), 500);
    }

    /**
     * Cancela la edición de la fila
     */
    onRowEditCancel(referencia: Referencia, index: number) {
        const original = this.editingReferencias[referencia.id];
        if (original) {
            Object.assign(referencia, original);
        }
        delete this.editingReferencias[referencia.id];
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
                setTimeout(() => this.cargarReferencias(), 500);
            }
        });
    }
}
