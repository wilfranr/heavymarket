import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { OrdenCompra, OrdenCompraEstado, OrdenCompraColor } from '../../../core/models/orden-compra.model';
import * as OrdenesCompraActions from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { TerceroService } from '../../../core/services/tercero.service';

interface SelectOption<T> {
    label: string;
    value: T;
}

export function ordenCompraEstadoSeverity(estado: OrdenCompraEstado | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
        case 'Confirmada':
        case 'Pagada':
        case 'Recibida':
            return 'success';
        case 'Enviada':
        case 'Despachada':
            return 'info';
        case 'Generada':
        case 'Recibida parcialmente':
            return 'warn';
        case 'Cancelada':
            return 'danger';
        default:
            return 'secondary';
    }
}

export function ordenCompraColorTooltip(color: OrdenCompraColor | null): string {
    switch (color) {
        case '#FFFF00':
            return 'Generada';
        case '#2196F3':
            return 'Enviada';
        case '#8BC34A':
            return 'Confirmada';
        case '#9C27B0':
            return 'Pagada';
        case '#E91E63':
            return 'Despachada';
        case '#FF9800':
            return 'Recibida parcialmente';
        case '#00ff00':
            return 'Recibida';
        case '#ff0000':
            return 'Cancelada';
        default:
            return 'Desconocido';
    }
}

/**
 * Componente de Lista de Órdenes de Compra
 */
@Component({
    selector: 'app-ordenes-compra-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule, IconFieldModule, InputIconModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Órdenes de Compra</h2>

            <div class="mb-4">
                <div class="flex flex-col md:flex-row justify-between gap-4">
                    <div class="flex gap-2 flex-wrap">
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </p-iconfield>

                        <p-select [options]="estadosOptions" [(ngModel)]="filters().estado" (ngModelChange)="applyFilters()" placeholder="Estado" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="coloresOptions" [(ngModel)]="filters().color" (ngModelChange)="applyFilters()" placeholder="Color" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="proveedores()" [(ngModel)]="filters().proveedor_id" (ngModelChange)="applyFilters()" placeholder="Proveedor" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [text]="true" (onClick)="limpiarFiltros()"> </p-button>
                        <p-button label="Nueva Orden" icon="pi pi-plus" (onClick)="onCreateOrdenCompra()"> </p-button>
                    </div>
                </div>
            </div>

            <p-table [value]="ordenesCompra()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" [lazy]="true" (onLazyLoad)="onLazyLoad($event)" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Estado</th>
                        <th>Semáforo</th>
                        <th>Expedición</th>
                        <th>Entrega</th>
                        <th>Total</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-orden>
                    <tr>
                        <td>
                            <span class="font-bold">OC-{{ orden.id }}</span>
                        </td>
                        <td>{{ orden.proveedor?.nombre || 'N/A' }}</td>
                        <td>
                            <p-tag [value]="orden.estado || 'N/A'" [severity]="getEstadoSeverity(orden.estado)"> </p-tag>
                        </td>
                        <td class="text-center">
                            <div class="mx-auto w-4 h-4 rounded-full" [style.background-color]="orden.color || '#FFFF00'" style="border: 1px solid var(--p-surface-border)" [title]="getColorTooltip(orden.color)"></div>
                        </td>
                        <td>{{ orden.fecha_expedicion | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ orden.fecha_entrega | date: 'dd/MM/yyyy' }}</td>
                        <td class="font-bold text-primary">{{ orden.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                        <td class="text-center">
                            <div class="flex justify-center gap-1">
                                <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewOrdenCompra(orden.id)"></p-button>
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditOrdenCompra(orden.id)"></p-button>
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteOrdenCompra(orden)"></p-button>
                            </div>
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
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly terceroService = inject(TerceroService);

    // Signals from Store
    ordenesCompra = toSignal(this.store.select(OrdenesCompraSelectors.selectAllOrdenesCompra), { initialValue: [] });
    loading = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading), { initialValue: false });
    total = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraTotal), { initialValue: 0 });

    // Local State Signals
    filters = signal<{
        estado?: OrdenCompraEstado;
        color?: OrdenCompraColor;
        proveedor_id?: number;
        search?: string;
        page?: number;
    }>({});

    proveedores = signal<SelectOption<number>[]>([]);

    estadosOptions: SelectOption<OrdenCompraEstado>[] = [
        { label: 'Generada', value: 'Generada' },
        { label: 'Enviada', value: 'Enviada' },
        { label: 'Confirmada', value: 'Confirmada' },
        { label: 'Pagada', value: 'Pagada' },
        { label: 'Despachada', value: 'Despachada' },
        { label: 'Recibida parcialmente', value: 'Recibida parcialmente' },
        { label: 'Recibida', value: 'Recibida' },
        { label: 'Cancelada', value: 'Cancelada' }
    ];

    coloresOptions: SelectOption<OrdenCompraColor>[] = [
        { label: 'Amarillo (Generada)', value: '#FFFF00' },
        { label: 'Azul (Enviada)', value: '#2196F3' },
        { label: 'Verde claro (Confirmada)', value: '#8BC34A' },
        { label: 'Púrpura (Pagada)', value: '#9C27B0' },
        { label: 'Rosa (Despachada)', value: '#E91E63' },
        { label: 'Naranja (Recibida parcialmente)', value: '#FF9800' },
        { label: 'Verde (Recibida)', value: '#00ff00' },
        { label: 'Rojo (Cancelada)', value: '#ff0000' }
    ];

    ngOnInit() {
        this.loadFilterOptions();
        this.applyFilters();
    }

    private loadFilterOptions(): void {
        this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe({
            next: (response) => {
                this.proveedores.set(
                    response.data.map((t) => ({
                        label: t.nombre,
                        value: t.id
                    }))
                );
            }
        });
    }

    applyFilters() {
        this.store.dispatch(OrdenesCompraActions.loadOrdenesCompra({ ...this.filters() }));
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        const first = event.first ?? 0;
        const rows = event.rows ?? 15;
        const page = first / rows + 1;
        this.filters.update((f) => ({ ...f, page }));
        this.applyFilters();
    }

    onSearch(event: Event) {
        const search = event.target instanceof HTMLInputElement ? event.target.value : '';
        if (search.length === 0 || search.length >= 3) {
            this.filters.update((f) => ({ ...f, search, page: 1 }));
            this.applyFilters();
        }
    }

    limpiarFiltros() {
        this.filters.set({});
        this.applyFilters();
    }

    onCreateOrdenCompra() {
        this.router.navigate(['/app/ordenes-compra/create']);
    }

    onViewOrdenCompra(id: number) {
        this.router.navigate(['/app/ordenes-compra', id]);
    }

    onEditOrdenCompra(id: number) {
        this.router.navigate(['/app/ordenes-compra', id, 'edit']);
    }

    onDeleteOrdenCompra(orden: OrdenCompra) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la orden de compra OC-${orden.id}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(OrdenesCompraActions.deleteOrdenCompra({ id: orden.id }));
            }
        });
    }

    getEstadoSeverity(estado: OrdenCompraEstado | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        return ordenCompraEstadoSeverity(estado);
    }

    getColorTooltip(color: OrdenCompraColor | null): string {
        return ordenCompraColorTooltip(color);
    }
}
