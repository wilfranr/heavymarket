import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Categoria } from '../../../core/models/categoria.model';
import * as CategoriasActions from '../../../store/categorias/actions/categorias.actions';
import * as CategoriasSelectors from '../../../store/categorias/selectors/categorias.selectors';

/**
 * Componente de Lista de Categorías
 */
@Component({
    selector: 'app-categorias-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, ConfirmDialogModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Categorías</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </span>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Nueva Categoría" icon="pi pi-plus" (onClick)="onCreateCategoria()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Categorías -->
            <p-table [value]="categorias()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Nombre</th>
                        <th>Proveedores</th>
                        <th>Referencias</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-categoria>
                    <tr>
                        <td>{{ categoria.nombre }}</td>
                        <td>
                            @if (categoria.terceros && categoria.terceros.length > 0) {
                                {{ categoria.terceros.length }} proveedor(es)
                            } @else {
                                Sin proveedores
                            }
                        </td>
                        <td>
                            @if (categoria.referencias && categoria.referencias.length > 0) {
                                {{ categoria.referencias.length }} referencia(s)
                            } @else {
                                Sin referencias
                            }
                        </td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewCategoria(categoria.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditCategoria(categoria.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteCategoria(categoria)"> </p-button>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-confirmDialog></p-confirmDialog>
    `,
    styles: []
})
export class ListComponent implements OnInit {
    private store = inject(Store);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);

    // Signals para estado local
    categorias = signal<Categoria[]>([]);
    loading = signal(false);
    total = signal(0);

    ngOnInit() {
        // Cargar categorías inicial
        this.loadCategorias();

        // Suscribirse al store
        this.store.select(CategoriasSelectors.selectAllCategorias).subscribe((categorias) => {
            this.categorias.set(categorias);
        });

        this.store.select(CategoriasSelectors.selectCategoriasLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(CategoriasSelectors.selectCategoriasTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    loadCategorias(params: any = {}) {
        this.store.dispatch(CategoriasActions.loadCategorias(params));
    }

    onSearch(event: any) {
        const search = event.target.value;
        if (search.length === 0 || search.length >= 3) {
            this.loadCategorias({ search });
        }
    }

    onCreateCategoria() {
        this.router.navigate(['/app/categorias/create']);
    }

    onViewCategoria(id: number) {
        this.router.navigate(['/app/categorias', id]);
    }

    onEditCategoria(id: number) {
        this.router.navigate(['/app/categorias', id, 'edit']);
    }

    onDeleteCategoria(categoria: Categoria) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(CategoriasActions.deleteCategoria({ id: categoria.id }));
            }
        });
    }
}
