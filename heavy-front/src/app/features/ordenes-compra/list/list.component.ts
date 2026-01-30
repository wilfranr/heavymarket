import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrdenCompra, OrdenCompraEstado, OrdenCompraColor } from '../../../core/models/orden-compra.model';
import * as OrdenesCompraActions from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';

/**
 * Componente de Lista de Órdenes de Compra
 *
 * Muestra tabla de órdenes de compra con filtros, búsqueda y acciones CRUD
 */
@Component({
    selector: 'app-ordenes-compra-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Órdenes de Compra</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </span>

                        <p-select [options]="estadosOptions" [(ngModel)]="selectedEstado" (ngModelChange)="onEstadoChange($event)" placeholder="Estado" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="coloresOptions" [(ngModel)]="selectedColor" (ngModelChange)="onColorChange($event)" placeholder="Color" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="proveedores" [(ngModel)]="selectedProveedor" (ngModelChange)="onProveedorChange($event)" placeholder="Proveedor" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="pedidos" [(ngModel)]="selectedPedido" (ngModelChange)="onPedidoChange($event)" placeholder="Pedido" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" [text]="true" (onClick)="limpiarFiltros()"> </p-button>
                        <p-button label="Nueva Orden" icon="pi pi-plus" (onClick)="onCreateOrdenCompra()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Órdenes de Compra -->
            <p-table [value]="ordenesCompra()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Cliente</th>
                        <th>Pedido</th>
                        <th>Estado</th>
                        <th>Color</th>
                        <th>Fecha Expedición</th>
                        <th>Fecha Entrega</th>
                        <th>Valor Total</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-orden>
                    <tr>
                        <td>OC-{{ orden.id }}</td>
                        <td>{{ orden.proveedor?.nombre || 'N/A' }}</td>
                        <td>{{ orden.tercero?.nombre || 'N/A' }}</td>
                        <td>#{{ orden.pedido_id || 'N/A' }}</td>
                        <td>
                            <p-tag [value]="orden.estado || 'N/A'" [severity]="getEstadoSeverity(orden.estado || 'Pendiente')"> </p-tag>
                        </td>
                        <td>
                            <div [style.background-color]="orden.color || '#FFFF00'" [style.width]="'20px'" [style.height]="'20px'" [style.border-radius]="'50%'" [title]="getColorTooltip(orden.color || '#FFFF00')"></div>
                        </td>
                        <td>{{ orden.fecha_expedicion | date: 'short' }}</td>
                        <td>{{ orden.fecha_entrega | date: 'short' }}</td>
                        <td>{{ orden.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewOrdenCompra(orden.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditOrdenCompra(orden.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteOrdenCompra(orden)"> </p-button>
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
    private terceroService = inject(TerceroService);
    private pedidoService = inject(PedidoService);

    // Signals para estado local
    ordenesCompra = signal<OrdenCompra[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedEstado: string | null = null;
    selectedColor: string | null = null;
    selectedProveedor: number | null = null;
    selectedPedido: number | null = null;

    // Opciones para filtros
    proveedores: any[] = [];
    pedidos: any[] = [];

    estadosOptions: Array<{ label: string; value: OrdenCompraEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En proceso', value: 'En proceso' },
        { label: 'Entregado', value: 'Entregado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    coloresOptions: Array<{ label: string; value: OrdenCompraColor }> = [
        { label: 'En proceso', value: '#FFFF00' },
        { label: 'Entregado', value: '#00ff00' },
        { label: 'Cancelado', value: '#ff0000' }
    ];

    ngOnInit() {
        // Cargar datos para filtros
        this.loadFilterOptions();

        // Cargar órdenes de compra inicial
        this.loadOrdenesCompra();

        // Suscribirse al store
        this.store.select(OrdenesCompraSelectors.selectAllOrdenesCompra).subscribe((ordenesCompra) => {
            this.ordenesCompra.set(ordenesCompra);
        });

        this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(OrdenesCompraSelectors.selectOrdenesCompraTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    /**
     * Carga las opciones para los filtros
     */
    private loadFilterOptions(): void {
        // Cargar proveedores (terceros tipo Proveedor)
        this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe({
            next: (response) => {
                this.proveedores = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                }));
            }
        });

        // Cargar pedidos
        this.pedidoService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.pedidos = response.data.map((p: any) => ({
                    label: `Pedido #${p.id} - ${p.tercero?.nombre || 'N/A'}`,
                    value: p.id
                }));
            }
        });
    }

    loadOrdenesCompra(params: any = {}) {
        // Construir parámetros de filtro
        const filterParams: any = {};

        if (this.selectedEstado) {
            filterParams.estado = this.selectedEstado;
        }
        if (this.selectedColor) {
            filterParams.color = this.selectedColor;
        }
        if (this.selectedProveedor) {
            filterParams.proveedor_id = this.selectedProveedor;
        }
        if (this.selectedPedido) {
            filterParams.pedido_id = this.selectedPedido;
        }

        // Combinar con otros parámetros (búsqueda, paginación, etc.)
        const finalParams = { ...filterParams, ...params };

        this.store.dispatch(OrdenesCompraActions.loadOrdenesCompra(finalParams));
    }

    onSearch(event: any) {
        const search = event.target.value;
        if (search.length === 0 || search.length >= 3) {
            this.loadOrdenesCompra({ search });
        }
    }

    onEstadoChange(estado: string | null) {
        this.selectedEstado = estado;
        this.loadOrdenesCompra();
    }

    onColorChange(color: string | null) {
        this.selectedColor = color;
        this.loadOrdenesCompra();
    }

    onProveedorChange(proveedorId: number | null) {
        this.selectedProveedor = proveedorId;
        this.loadOrdenesCompra();
    }

    onPedidoChange(pedidoId: number | null) {
        this.selectedPedido = pedidoId;
        this.loadOrdenesCompra();
    }

    limpiarFiltros() {
        this.selectedEstado = null;
        this.selectedColor = null;
        this.selectedProveedor = null;
        this.selectedPedido = null;
        this.loadOrdenesCompra();
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

    getEstadoSeverity(estado: OrdenCompraEstado): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Entregado':
                return 'success';
            case 'En proceso':
                return 'info';
            case 'Pendiente':
                return 'warn';
            case 'Cancelado':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getColorTooltip(color: OrdenCompraColor): string {
        switch (color) {
            case '#FFFF00':
                return 'En proceso';
            case '#00ff00':
                return 'Entregado';
            case '#ff0000':
                return 'Cancelado';
            default:
                return 'Desconocido';
        }
    }
}
