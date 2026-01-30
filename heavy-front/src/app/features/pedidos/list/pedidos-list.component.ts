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
import { ConfirmationService } from 'primeng/api';
import { Pedido, PedidoEstado } from '../../../core/models/pedido.model';
import * as PedidosActions from '../../../store/pedidos/actions/pedidos.actions';
import * as PedidosSelectors from '../../../store/pedidos/selectors/pedidos.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';

/**
 * Componente de Lista de Pedidos
 *
 * Muestra tabla de pedidos con filtros, búsqueda y acciones CRUD
 */
@Component({
    selector: 'app-pedidos-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule],
    providers: [ConfirmationService],
    template: `
        <div class="card">
            <h2>Gestión de Pedidos</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </span>

                        <p-select [options]="estadosOptions" [(ngModel)]="selectedEstado" (ngModelChange)="onEstadoChange($event)" placeholder="Estado" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="terceros" [(ngModel)]="selectedTercero" (ngModelChange)="onTerceroChange($event)" placeholder="Cliente" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="maquinas" [(ngModel)]="selectedMaquina" (ngModelChange)="onMaquinaChange($event)" placeholder="Máquina" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="fabricantes" [(ngModel)]="selectedFabricante" (ngModelChange)="onFabricanteChange($event)" placeholder="Fabricante" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" [text]="true" (onClick)="limpiarFiltros()"> </p-button>
                        <p-button label="Nuevo Pedido" icon="pi pi-plus" (onClick)="onCreatePedido()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Pedidos -->
            <p-table [value]="pedidos()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>ID</th>
                        <th>Tercero</th>
                        <th>Estado</th>
                        <th>Dirección</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-pedido>
                    <tr>
                        <td>{{ pedido.id }}</td>
                        <td>{{ pedido.tercero?.razon_social || 'N/A' }}</td>
                        <td>
                            <p-tag [value]="pedido.estado" [severity]="getEstadoSeverity(pedido.estado)"> </p-tag>
                        </td>
                        <td>{{ pedido.direccion || 'N/A' }}</td>
                        <td>{{ pedido.created_at | date: 'short' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewPedido(pedido.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditPedido(pedido.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeletePedido(pedido)"> </p-button>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-confirmDialog></p-confirmDialog>
    `,
    styles: []
})
export class PedidosListComponent implements OnInit {
    private store = inject(Store);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private terceroService = inject(TerceroService);
    private maquinaService = inject(MaquinaService);
    private fabricanteService = inject(FabricanteService);

    // Signals para estado local
    pedidos = signal<Pedido[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedEstado: string | null = null;
    selectedTercero: number | null = null;
    selectedVendedor: number | null = null;
    selectedMaquina: number | null = null;
    selectedFabricante: number | null = null;

    // Opciones para filtros
    terceros: any[] = [];
    vendedores: any[] = [];
    maquinas: any[] = [];
    fabricantes: any[] = [];

    estadosOptions: Array<{ label: string; value: PedidoEstado }> = [
        { label: 'Nuevo', value: 'Nuevo' },
        { label: 'Enviado', value: 'Enviado' },
        { label: 'En Costeo', value: 'En_Costeo' },
        { label: 'Cotizado', value: 'Cotizado' },
        { label: 'Aprobado', value: 'Aprobado' },
        { label: 'Entregado', value: 'Entregado' },
        { label: 'Rechazado', value: 'Rechazado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    ngOnInit() {
        // Cargar datos para filtros
        this.loadFilterOptions();

        // Cargar pedidos inicial
        this.loadPedidos();

        // Suscribirse al store
        this.store.select(PedidosSelectors.selectAllPedidos).subscribe((pedidos) => {
            this.pedidos.set(pedidos);
        });

        this.store.select(PedidosSelectors.selectPedidosLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(PedidosSelectors.selectPedidosTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    /**
     * Carga las opciones para los filtros
     */
    private loadFilterOptions(): void {
        // Cargar terceros (clientes)
        this.terceroService.list({ per_page: 200, es_cliente: true }).subscribe({
            next: (response) => {
                this.terceros = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                }));
            }
        });

        // Cargar máquinas
        this.maquinaService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.maquinas = response.data.map((m) => ({
                    label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''}`,
                    value: m.id
                }));
            }
        });

        // Cargar fabricantes
        this.fabricanteService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data.map((f) => ({
                    label: f.nombre,
                    value: f.id
                }));
            }
        });

        // Cargar usuarios (vendedores) - si existe el servicio
        // TODO: Implementar cuando esté disponible el servicio de usuarios
    }

    loadPedidos(params: any = {}) {
        // Construir parámetros de filtro
        const filterParams: any = {};

        if (this.selectedEstado) {
            filterParams.estado = this.selectedEstado;
        }
        if (this.selectedTercero) {
            filterParams.tercero_id = this.selectedTercero;
        }
        if (this.selectedVendedor) {
            filterParams.user_id = this.selectedVendedor;
        }
        if (this.selectedMaquina) {
            filterParams.maquina_id = this.selectedMaquina;
        }
        if (this.selectedFabricante) {
            filterParams.fabricante_id = this.selectedFabricante;
        }

        // Combinar con otros parámetros (búsqueda, paginación, etc.)
        const finalParams = { ...filterParams, ...params };

        this.store.dispatch(PedidosActions.loadPedidos({ params: finalParams }));
    }

    onSearch(event: any) {
        const search = event.target.value;
        this.loadPedidos({ search });
    }

    onEstadoChange(value: any) {
        this.selectedEstado = value;
        this.loadPedidos();
    }

    onTerceroChange(value: any) {
        this.selectedTercero = value;
        this.loadPedidos();
    }

    onVendedorChange(value: any) {
        this.selectedVendedor = value;
        this.loadPedidos();
    }

    onMaquinaChange(value: any) {
        this.selectedMaquina = value;
        this.loadPedidos();
    }

    onFabricanteChange(value: any) {
        this.selectedFabricante = value;
        this.loadPedidos();
    }

    limpiarFiltros(): void {
        this.selectedEstado = null;
        this.selectedTercero = null;
        this.selectedVendedor = null;
        this.selectedMaquina = null;
        this.selectedFabricante = null;
        this.loadPedidos();
    }

    onCreatePedido() {
        this.router.navigate(['/app/pedidos/create']);
    }

    onViewPedido(id: number) {
        this.router.navigate(['/app/pedidos', id]);
    }

    onEditPedido(id: number) {
        this.router.navigate(['/app/pedidos', id, 'edit']);
    }

    onDeletePedido(pedido: Pedido) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el pedido #${pedido.id}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(PedidosActions.deletePedido({ id: pedido.id }));
            }
        });
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' {
        const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            Nuevo: 'info',
            Enviado: 'info',
            En_Costeo: 'warn',
            Cotizado: 'warn',
            Aprobado: 'success',
            Entregado: 'success',
            Rechazado: 'danger',
            Cancelado: 'danger'
        };
        return severityMap[estado] || 'info';
    }
}
