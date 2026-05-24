import { afterNextRender, ChangeDetectionStrategy, Component, OnInit, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';

import { Lista, ListaTipo } from '../../../core/models/lista.model';
import { loadListas, deleteLista } from '../../../store/listas/actions/listas.actions';
import { selectAllListas, selectListasLoading, selectListasPagination } from '../../../store/listas/selectors/listas.selectors';
import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';

/**
 * Componente de lista de Listas
 * Muestra tabla con todos los catálogos (marcas, tipos de máquina, etc.)
 */
@Component({
    selector: 'app-listas-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, TagModule, ToastModule, ConfirmDialogModule, FormsModule, TooltipModule, FallbackImageDirective, IconFieldModule, InputIconModule, TabsModule],
    providers: [MessageService],
    templateUrl: './list.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            app-listas-list .p-tablist-tab-list {
                justify-content: center;
            }
        `
    ]
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    listas = toSignal(this.store.select(selectAllListas), { initialValue: [] as Lista[] });
    loading = toSignal(this.store.select(selectListasLoading), { initialValue: false });
    pagination = toSignal(this.store.select(selectListasPagination), {
        initialValue: { total: 0, currentPage: 1, lastPage: 1 }
    });

    currentPage = 1;
    rowsPerPage = 10;
    first = 0;

    sortField = 'id';
    sortOrder = 1;

    selectedTipo: ListaTipo | null = null;
    selectedTabValue: string = 'Todos';
    searchTerm = '';
    private searchSubject = new Subject<string>();

    tipos: { label: string; value: string; tipoValue: ListaTipo | null; icon: string }[] = [
        { label: 'Todos', value: 'Todos', tipoValue: null, icon: 'pi pi-list' },
        { label: 'Marcas', value: 'Marca', tipoValue: 'Marca', icon: 'pi pi-bookmark' },
        { label: 'Fabricantes', value: 'Fabricantes', tipoValue: 'Fabricantes', icon: 'pi pi-globe' },
        { label: 'Tipos de Máquina', value: 'Tipo de Máquina', tipoValue: 'Tipo de Máquina', icon: 'pi pi-cog' },
        { label: 'Tipos de Artículo', value: 'Tipo de Artículo', tipoValue: 'Tipo de Artículo', icon: 'pi pi-box' },
        { label: 'Categorías Comerciales', value: 'Categoría Comercial', tipoValue: 'Categoría Comercial', icon: 'pi pi-tag' },
        { label: 'Unidades Medida', value: 'Unidad de Medida', tipoValue: 'Unidad de Medida', icon: 'pi pi-ruler-combined' },
        { label: 'Tipos de Medida', value: 'Tipo de Medida', tipoValue: 'Tipo de Medida', icon: 'pi pi-sliders-h' },
        { label: 'Nombres de Medida', value: 'Nombre de Medida', tipoValue: 'Nombre de Medida', icon: 'pi pi-tag' },
        { label: 'Piezas Estandar', value: 'Piezas Estandar', tipoValue: 'Piezas Estandar', icon: 'pi pi-objects-column' }
    ];

    constructor() {
        afterNextRender(() => this.loadListas());
    }

    ngOnInit(): void {
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((term) => {
            this.searchTerm = term;
            this.currentPage = 1;
            this.first = 0;
            this.loadListas();
        });
    }

    onSearch(term: string): void {
        this.searchSubject.next(term);
    }

    onTabChange(value: unknown): void {
        this.selectedTabValue = value as string;
        const tipo = this.tipos.find((t) => t.value === value);
        this.selectedTipo = tipo?.tipoValue ?? null;
        this.currentPage = 1;
        this.first = 0;
        this.loadListas();
    }

    limpiarFiltros(): void {
        this.selectedTabValue = 'Todos';
        this.selectedTipo = null;
        this.searchTerm = '';
        this.currentPage = 1;
        this.first = 0;
        this.loadListas();
    }

    onPageChange(event: { first: number; rows: number }): void {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.currentPage = Math.floor(event.first / event.rows) + 1;
        this.loadListas();
    }

    onSort(event: { field: string; order: number }): void {
        this.sortField = event.field;
        this.sortOrder = event.order;
        this.currentPage = 1;
        this.first = 0;
        this.loadListas();
    }

    private loadListas(): void {
        const params: {
            page: number;
            per_page: number;
            sort_by: string;
            sort_order: 'asc' | 'desc';
            tipo?: ListaTipo;
            search?: string;
        } = {
            page: this.currentPage,
            per_page: this.rowsPerPage,
            sort_by: this.sortField,
            sort_order: this.sortOrder === 1 ? 'asc' : 'desc'
        };
        if (this.selectedTipo) {
            params.tipo = this.selectedTipo;
        }
        if (this.searchTerm) {
            params.search = this.searchTerm;
        }
        this.store.dispatch(loadListas(params));
    }

    verDetalle(lista: Lista): void {
        this.router.navigate(['/app/listas', lista.id]);
    }

    editarLista(lista: Lista): void {
        this.router.navigate(['/app/listas', lista.id, 'edit']);
    }

    eliminarLista(lista: Lista): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la lista "${lista.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteLista({ id: lista.id }));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Lista eliminada correctamente'
                });
            }
        });
    }

    crearLista(): void {
        this.router.navigate(['/app/listas/create']);
    }

    hasListaImagen(lista: Lista): boolean {
        return Boolean(this.listaImagenSrc(lista));
    }

    listaImagenSrc(lista: Lista): string | undefined {
        const src = lista.foto || lista.fotoMedida;
        return src && src.trim() !== '' ? src : undefined;
    }

    getTipoSeverity(tipo: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const severityMap: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            Marca: 'success',
            Fabricantes: 'info',
            'Tipo de Máquina': 'info',
            'Tipo de Artículo': 'warn',
            'Unidad de Medida': 'secondary',
            'Tipo de Medida': 'info',
            'Nombre de Medida': 'contrast',
            'Piezas Estandar': 'warn'
        };
        return severityMap[tipo] || 'secondary';
    }
}
