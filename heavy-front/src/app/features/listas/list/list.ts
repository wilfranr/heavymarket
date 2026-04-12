import { Component, OnInit, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        FormsModule,
        TooltipModule,
        FallbackImageDirective,
        IconFieldModule,
        InputIconModule,
        TabsModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './list.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`
        app-listas-list .p-tablist-tab-list {
            justify-content: center;
        }
    `]
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    listas$!: Observable<Lista[]>;
    loading$!: Observable<boolean>;
    pagination$!: Observable<{ total: number; currentPage: number; lastPage: number }>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 10;
    first = 0;

    // Ordenamiento
    sortField = 'id';
    sortOrder = 1; // 1 asc, -1 desc

    // Filtros
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

    ngOnInit(): void {
        this.loadListas();
        this.listas$ = this.store.select(selectAllListas);
        this.loading$ = this.store.select(selectListasLoading);
        this.pagination$ = this.store.select(selectListasPagination);

        // Setup search debounce
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(term => {
            this.searchTerm = term;
            this.currentPage = 1;
            this.first = 0;
            this.loadListas();
        });
    }

    /**
     * Maneja la búsqueda
     */
    onSearch(term: string): void {
        this.searchSubject.next(term);
    }

    /**
     * Cambia el tab seleccionado y filtra
     */
    onTabChange(value: any): void {
        this.selectedTabValue = value as string;
        const tipo = this.tipos.find(t => t.value === value);
        this.selectedTipo = tipo?.tipoValue ?? null;
        this.currentPage = 1;
        this.first = 0;
        this.loadListas();
    }

    /**
     * Limpia todos los filtros
     */
    limpiarFiltros(): void {
        this.selectedTabValue = 'Todos';
        this.selectedTipo = null;
        this.searchTerm = '';
        this.currentPage = 1;
        this.first = 0;
        this.loadListas();
    }

    /**
     * Maneja el cambio de página
     */
    onPageChange(event: any): void {
        this.first = event.first;
        this.rowsPerPage = event.rows;
        this.currentPage = Math.floor(event.first / event.rows) + 1;
        this.loadListas();
    }

    /**
     * Maneja el ordenamiento
     */
    onSort(event: any): void {
        this.sortField = event.field;
        this.sortOrder = event.order;
        this.currentPage = 1; // Reset to first page when sorting
        this.first = 0;
        this.loadListas();
    }

    /**
     * Carga las listas con los parámetros actuales
     */
    private loadListas(): void {
        const params: any = {
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

    /**
     * Navega al detalle de la lista
     */
    verDetalle(lista: Lista): void {
        this.router.navigate(['/app/listas', lista.id]);
    }

    /**
     * Navega al formulario de edición
     */
    editarLista(lista: Lista): void {
        this.router.navigate(['/app/listas', lista.id, 'edit']);
    }

    /**
     * Elimina una lista con confirmación
     */
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

    /**
     * Navega al formulario de creación
     */
    crearLista(): void {
        this.router.navigate(['/app/listas/create']);
    }

    /**
     * Obtiene el severity del tag según el tipo
     */
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
