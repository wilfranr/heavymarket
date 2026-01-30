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
import { Cotizacion, CotizacionEstado } from '../../../core/models/cotizacion.model';
import * as CotizacionesActions from '../../../store/cotizaciones/actions/cotizaciones.actions';
import * as CotizacionesSelectors from '../../../store/cotizaciones/selectors/cotizaciones.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';

/**
 * Componente de Lista de Cotizaciones
 *
 * Muestra tabla de cotizaciones con filtros, búsqueda y acciones CRUD
 */
@Component({
    selector: 'app-cotizaciones-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Cotizaciones</h2>

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

                        <p-select [options]="pedidos" [(ngModel)]="selectedPedido" (ngModelChange)="onPedidoChange($event)" placeholder="Pedido" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" [text]="true" (onClick)="limpiarFiltros()"> </p-button>
                        <p-button label="Nueva Cotización" icon="pi pi-plus" (onClick)="onCreateCotizacion()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Cotizaciones -->
            <p-table [value]="cotizaciones()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Pedido</th>
                        <th>Estado</th>
                        <th>Fecha Emisión</th>
                        <th>Fecha Vencimiento</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-cotizacion>
                    <tr>
                        <td>{{ cotizacion.id }}</td>
                        <td>{{ cotizacion.tercero?.nombre || 'N/A' }}</td>
                        <td>#{{ cotizacion.pedido_id }}</td>
                        <td>
                            <p-tag [value]="cotizacion.estado" [severity]="getEstadoSeverity(cotizacion.estado)"> </p-tag>
                        </td>
                        <td>{{ cotizacion.fecha_emision | date: 'short' }}</td>
                        <td>{{ cotizacion.fecha_vencimiento | date: 'short' }}</td>
                        <td>{{ cotizacion.total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewCotizacion(cotizacion.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditCotizacion(cotizacion.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteCotizacion(cotizacion)"> </p-button>
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
    cotizaciones = signal<Cotizacion[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedEstado: string | null = null;
    selectedTercero: number | null = null;
    selectedPedido: number | null = null;

    // Opciones para filtros
    terceros: any[] = [];
    pedidos: any[] = [];

    estadosOptions: Array<{ label: string; value: CotizacionEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Enviada', value: 'Enviada' },
        { label: 'Aprobada', value: 'Aprobada' },
        { label: 'Rechazada', value: 'Rechazada' },
        { label: 'Vencida', value: 'Vencida' },
        { label: 'En Proceso', value: 'En_Proceso' }
    ];

    ngOnInit() {
        // Cargar datos para filtros
        this.loadFilterOptions();

        // Cargar cotizaciones inicial
        this.loadCotizaciones();

        // Suscribirse al store
        this.store.select(CotizacionesSelectors.selectAllCotizaciones).subscribe((cotizaciones) => {
            this.cotizaciones.set(cotizaciones);
        });

        this.store.select(CotizacionesSelectors.selectCotizacionesLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(CotizacionesSelectors.selectCotizacionesTotal).subscribe((total) => {
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

    loadCotizaciones(params: any = {}) {
        // Construir parámetros de filtro
        const filterParams: any = {};

        if (this.selectedEstado) {
            filterParams.estado = this.selectedEstado;
        }
        if (this.selectedTercero) {
            filterParams.tercero_id = this.selectedTercero;
        }
        if (this.selectedPedido) {
            filterParams.pedido_id = this.selectedPedido;
        }

        // Combinar con otros parámetros (búsqueda, paginación, etc.)
        const finalParams = { ...filterParams, ...params };

        this.store.dispatch(CotizacionesActions.loadCotizaciones(finalParams));
    }

    onSearch(event: any) {
        const search = event.target.value;
        if (search.length === 0 || search.length >= 3) {
            this.loadCotizaciones({ search });
        }
    }

    onEstadoChange(estado: string | null) {
        this.selectedEstado = estado;
        this.loadCotizaciones();
    }

    onTerceroChange(terceroId: number | null) {
        this.selectedTercero = terceroId;
        this.loadCotizaciones();
    }

    onPedidoChange(pedidoId: number | null) {
        this.selectedPedido = pedidoId;
        this.loadCotizaciones();
    }

    limpiarFiltros() {
        this.selectedEstado = null;
        this.selectedTercero = null;
        this.selectedPedido = null;
        this.loadCotizaciones();
    }

    onCreateCotizacion() {
        this.router.navigate(['/app/cotizaciones/create']);
    }

    onViewCotizacion(id: number) {
        this.router.navigate(['/app/cotizaciones', id]);
    }

    onEditCotizacion(id: number) {
        this.router.navigate(['/app/cotizaciones', id, 'edit']);
    }

    onDeleteCotizacion(cotizacion: Cotizacion) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la cotización #${cotizacion.id}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(CotizacionesActions.deleteCotizacion({ id: cotizacion.id }));
            }
        });
    }

    getEstadoSeverity(estado: CotizacionEstado): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Aprobada':
                return 'success';
            case 'Enviada':
            case 'En_Proceso':
                return 'info';
            case 'Pendiente':
                return 'warn';
            case 'Rechazada':
            case 'Vencida':
                return 'danger';
            default:
                return 'secondary';
        }
    }
}
