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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Cotizacion, CotizacionEstado } from '../../../core/models/cotizacion.model';
import * as CotizacionesActions from '../../../store/cotizaciones/actions/cotizaciones.actions';
import * as CotizacionesSelectors from '../../../store/cotizaciones/selectors/cotizaciones.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';

/**
 * Componente de Lista de Cotizaciones
 *
 * Muestra tabla de cotizaciones con filtros, búsqueda y acciones CRUD
 */
@Component({
    selector: 'app-cotizaciones-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule, IconFieldModule, InputIconModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Cotizaciones</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </p-iconfield>

                        <p-select [options]="estadosOptions" [(ngModel)]="selectedEstado" (ngModelChange)="onEstadoChange($event)" placeholder="Estado" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="terceros()" [(ngModel)]="selectedTercero" (ngModelChange)="onTerceroChange($event)" placeholder="Cliente" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>

                        <p-select [options]="pedidos()" [(ngModel)]="selectedPedido" (ngModelChange)="onPedidoChange($event)" placeholder="Pedido" [filter]="true" [showClear]="true" styleClass="w-48"> </p-select>
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
                            @if (cotizacion.estado === 'Borrador') {
                            <small class="block mt-1 text-orange-600 dark:text-orange-400">Falta tarifa de flete</small>
                            }
                        </td>
                        <td>{{ cotizacion.fecha_emision | date: 'short' }}</td>
                        <td>{{ cotizacion.fecha_vencimiento | date: 'short' }}</td>
                        <td>{{ cotizacion.total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewCotizacion(cotizacion.id)" pTooltip="Ver"> </p-button>
                            <p-button icon="pi pi-file-pdf" [rounded]="true" [text]="true" severity="danger" (onClick)="onDownloadPDF(cotizacion)" pTooltip="PDF"> </p-button>
                            @if (cotizacion.estado === 'Enviada' || cotizacion.estado === 'En_Proceso') {
                                <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="success" (onClick)="onApproveCotizacion(cotizacion)" pTooltip="Aprobar"> </p-button>
                                <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="warn" (onClick)="onRejectCotizacion(cotizacion)" pTooltip="Rechazar"> </p-button>
                            }
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditCotizacion(cotizacion.id)" pTooltip="Editar"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteCotizacion(cotizacion)" pTooltip="Eliminar"> </p-button>
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
    private messageService = inject(MessageService);
    private terceroService = inject(TerceroService);
    private pedidoService = inject(PedidoService);
    private cotizacionService = inject(CotizacionService);

    // Signals para estado local
    cotizaciones = signal<Cotizacion[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedEstado: string | null = null;
    selectedTercero: number | null = null;
    selectedPedido: number | null = null;

    // Opciones para filtros
    terceros = signal<any[]>([]);
    pedidos = signal<any[]>([]);

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
                this.terceros.set(response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                })));
            }
        });

        // Cargar pedidos
        this.pedidoService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.pedidos.set(response.data.map((p: any) => ({
                    label: `Pedido #${p.id} - ${p.tercero?.nombre || 'N/A'}`,
                    value: p.id
                })));
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

    onDownloadPDF(cotizacion: Cotizacion) {
        this.cotizacionService.downloadPDF(cotizacion.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `COT-${cotizacion.id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'PDF descargado exitosamente' });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF' });
            }
        });
    }

    onApproveCotizacion(cotizacion: Cotizacion) {
        this.confirmationService.confirm({
            message: `¿Está seguro de aprobar la cotización #${cotizacion.id}?`,
            header: 'Aprobar Cotización',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.cotizacionService.approve(cotizacion.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Aprobada', detail: 'Cotización aprobada exitosamente' });
                        this.loadCotizaciones();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la cotización' });
                    }
                });
            }
        });
    }

    onRejectCotizacion(cotizacion: Cotizacion) {
        this.confirmationService.confirm({
            message: `¿Está seguro de rechazar la cotización #${cotizacion.id}?`,
            header: 'Rechazar Cotización',
            icon: 'pi pi-times-circle',
            accept: () => {
                this.cotizacionService.reject(cotizacion.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'warn', summary: 'Rechazada', detail: 'Cotización rechazada exitosamente' });
                        this.loadCotizaciones();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la cotización' });
                    }
                });
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
            case 'Borrador':
                return 'warn';
            case 'Rechazada':
            case 'Vencida':
                return 'danger';
            default:
                return 'secondary';
        }
    }
}
