import { Component, OnInit, inject, signal, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

import { Pedido } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import * as PedidosActions from '../../../store/pedidos/actions/pedidos.actions';
import * as PedidosSelectors from '../../../store/pedidos/selectors/pedidos.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Componente de Lista de Pedidos
 *
 * Muestra tabla de pedidos con filtros, búsqueda y acciones CRUD
 */
@Component({
    selector: 'app-pedidos-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, ConfirmDialogModule, IconFieldModule, InputIconModule, TabsModule, TooltipModule],
    template: `
        <div class="card">
            <!-- Header: Título + Acción principal -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="m-0">{{ isAnalista ? 'Gestión de Análisis' : 'Gestión de Pedidos' }}</h2>
                <p-button *ngIf="!isAnalista" label="Nuevo Pedido" icon="pi pi-plus" (onClick)="onCreatePedido()"> </p-button>
            </div>

            <!-- Tabs de Estados -->
            <p-tabs [value]="selectedTabValue" (valueChange)="onTabChange($event)">
                <p-tablist>
                    <p-tab value="Todos">
                        <i class="pi pi-list mr-2"></i>
                        <span>Todos</span>
                    </p-tab>
                    <p-tab *ngFor="let tab of estadosTabs" [value]="tab.value">
                        <i [class]="tab.icon + ' mr-2'"></i>
                        <span>{{ tab.label }}</span>
                    </p-tab>
                </p-tablist>
            </p-tabs>

            <!-- Tabla de Pedidos -->
            <p-table #dt1 [value]="pedidos()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines" [globalFilterFields]="globalFilterFields()" [rowHover]="true">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center flex-column sm:flex-row">
                        <p-button label="Limpiar" class="p-button-outlined mb-2" icon="pi pi-filter-slash" (onClick)="limpiarFiltros(dt1)" severity="secondary" [outlined]="true"></p-button>
                        <p-iconfield iconPosition="left" class="ml-auto">
                            <p-inputicon>
                                <i class="pi pi-search"></i>
                            </p-inputicon>
                            <input pInputText type="text" #searchInput (input)="onSearch($event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template pTemplate="header">
                    <tr>
                        @if (isAnalista) {
                            <th style="min-width: 5rem">ID</th>
                            <th style="min-width: 12rem">Vendedor</th>
                            <th style="min-width: 8rem">Estado</th>
                            <th style="min-width: 8rem" class="text-center">Ítems solicitados</th>
                            <th style="min-width: 10rem">Tipo de máquina</th>
                            <th style="min-width: 10rem">Modelo</th>
                            <th style="min-width: 6rem" class="text-center">Comentarios</th>
                        } @else {
                            <th style="min-width: 5rem">ID</th>
                            <th style="min-width: 15rem">
                                <div class="flex justify-between items-center">
                                    Tercero
                                    <p-columnFilter field="tercero" matchMode="in" display="menu" [showMatchModes]="false" [showOperator]="false" [showAddButton]="false" [showApplyButton]="false" [showClearButton]="false">
                                        <ng-template pTemplate="header">
                                            <div class="px-3 pt-3 pb-0">
                                                <span class="font-bold">Filtrar por Cliente</span>
                                            </div>
                                        </ng-template>
                                        <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                                            <p-select [ngModel]="selectedTercero" [options]="terceros" optionLabel="label" optionValue="value" (onChange)="onTerceroChange($event.value)" placeholder="Seleccionar Cliente" [showClear]="true" styleClass="w-full" [filter]="true" filterBy="label"> </p-select>
                                        </ng-template>
                                    </p-columnFilter>
                                </div>
                            </th>
                            <th style="min-width: 8rem">Estado</th>
                            <th style="min-width: 8rem">Fecha</th>
                            <th style="min-width: 12rem">Máquina</th>
                            <th style="min-width: 10rem" class="text-center">Comentarios</th>
                            <th>Acciones</th>
                        }
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-pedido>
                    <tr (click)="onRowClick(pedido)" class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        @if (isAnalista) {
                            @let comPed = resumenComentariosPedido(pedido);
                            <td>{{ pedido.id }}</td>
                            <td>{{ pedido.user?.name || 'Sin asignar' }}</td>
                            <td>
                                @if (pedido.estado === 'Nuevo' && tieneDevolucionReciente(pedido)) {
                                    <span class="inline-flex items-center gap-1">
                                        <i class="pi pi-exclamation-circle text-orange-500" [pTooltip]="'Pedido devuelto por analista'" tooltipPosition="top"></i>
                                        <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"> </p-tag>
                                    </span>
                                } @else if (pedido.estado === 'En_Analisis' && tieneDevolucionAnalistaReciente(pedido)) {
                                    <span class="inline-flex items-center gap-1">
                                        <i class="pi pi-exclamation-circle text-orange-500" [pTooltip]="'Pedido devuelto por asesor'" tooltipPosition="top"></i>
                                        <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"> </p-tag>
                                    </span>
                                } @else {
                                    <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"> </p-tag>
                                }
                            </td>
                            <td class="text-center">{{ contarItemsSolicitados(pedido) }}</td>
                            <td>{{ pedido.maquina?.tipo || 'N/A' }}</td>
                            <td>{{ pedido.maquina?.modelo || 'N/A' }}</td>
                            <td class="text-center" (click)="$event.stopPropagation()">
                                @if (comPed.count > 0) {
                                    <span
                                        class="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1"
                                        style="color: var(--p-primary-color)"
                                        [pTooltip]="comPed.texto"
                                        tooltipPosition="top"
                                        [showDelay]="200"
                                        tooltipStyleClass="max-w-md whitespace-pre-wrap break-words"
                                    >
                                        <i class="pi pi-comments text-lg" aria-hidden="true"></i>
                                        <span class="text-sm font-semibold">{{ comPed.count }}</span>
                                    </span>
                                } @else {
                                    <span class="text-muted-color">—</span>
                                }
                            </td>
                        } @else {
                            @let comPed = resumenComentariosPedido(pedido);
                            <td>{{ pedido.id }}</td>
                            <td>{{ pedido.tercero?.nombre || 'N/A' }}</td>
                            <td>
                                @if (pedido.estado === 'Nuevo' && tieneDevolucionReciente(pedido)) {
                                    <span class="inline-flex items-center gap-1">
                                        <i class="pi pi-exclamation-circle text-orange-500" [pTooltip]="'Pedido devuelto por analista'" tooltipPosition="top"></i>
                                        <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"> </p-tag>
                                    </span>
                                } @else {
                                    <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"> </p-tag>
                                }
                            </td>
                            <td>{{ pedido.created_at | date: 'short' }}</td>
                            <td>{{ pedido.maquina?.modelo || 'Sin máquina' }}</td>
                            <td class="text-center" (click)="$event.stopPropagation()">
                                @if (comPed.count > 0) {
                                    <span
                                        class="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1"
                                        style="color: var(--p-primary-color)"
                                        [pTooltip]="comPed.texto"
                                        tooltipPosition="top"
                                        [showDelay]="200"
                                        tooltipStyleClass="max-w-md whitespace-pre-wrap break-words"
                                    >
                                        <i class="pi pi-comments text-lg" aria-hidden="true"></i>
                                        <span class="text-sm font-semibold">{{ comPed.count }}</span>
                                    </span>
                                } @else {
                                    <span class="text-muted-color">—</span>
                                }
                            </td>
                            <td>
                                <p-button *ngIf="vendedorPuedeMutarPedido(pedido)" icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditPedido(pedido.id); $event.stopPropagation()"> </p-button>
                                <p-button *ngIf="vendedorPuedeMutarPedido(pedido)" icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeletePedido(pedido); $event.stopPropagation()"> </p-button>
                            </td>
                        }
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-confirmDialog></p-confirmDialog>
    `,
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            app-pedidos-list .p-tablist-tab-list {
                justify-content: center;
            }
        `
    ]
})
export class PedidosListComponent implements OnInit {
    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;
    readonly pedidoEstadoTagClass = pedidoEstadoTagClass;

    private store = inject(Store);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private terceroService = inject(TerceroService);
    private authService = inject(AuthService);

    get isAnalista(): boolean {
        return this.authService.hasRole('Analista');
    }

    get isVendedor(): boolean {
        return this.authService.hasRole('Vendedor');
    }

    /** Vendedor: en análisis solo lectura; administración y logística siguen pudiendo gestionar. */
    vendedorPuedeMutarPedido(pedido: Pedido): boolean {
        // Un pedido cancelado no se puede editar ni volver a anular
        if (pedido.estado === 'Cancelado') {
            return false;
        }

        if (pedido.estado !== 'En_Analisis' || !this.isVendedor) {
            return true;
        }
        return this.authService.hasAnyRole(['Administrador', 'super_admin', 'Logistica']);
    }

    onRowClick(pedido: Pedido): void {
        if (pedido.estado === 'En_Costeo') {
            this.router.navigate(['/app/pedidos', pedido.id, 'costeo']);
            return;
        }

        if (this.isAnalista) {
            this.onAnalysisPedido(pedido.id);
        } else {
            this.onViewPedido(pedido.id);
        }
    }

    onAnalysisPedido(id: number) {
        this.router.navigate(['/app/pedidos', id, 'analysis']);
    }

    // Signals para estado local
    pedidos = signal<Pedido[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedEstado: string | null = null;
    selectedTercero: number | null = null;
    selectedVendedor: number | null = null;

    // Opciones para filtros
    terceros: any[] = [];
    vendedores: any[] = [];

    estadosTabs: any[] = [];
    selectedTabValue: string = 'Todos';

    ngOnInit() {
        // Inicializar Tabs
        this.initTabs();

        // Analista: el API solo expone En_Analisis; evitar pestañas que devuelvan lista vacía
        if (this.isAnalista) {
            this.estadosTabs = [{ label: 'Análisis', value: 'En_Analisis', icon: 'pi pi-cog' }];
            this.selectedTabValue = 'En_Analisis';
            this.selectedEstado = 'En_Analisis';
        }

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

        // Combinar con otros parámetros (búsqueda, paginación, etc.)
        const finalParams = { ...filterParams, ...params };

        this.store.dispatch(PedidosActions.loadPedidos({ params: finalParams }));
    }

    onSearch(event: any) {
        const search = event.target.value;
        this.loadPedidos({ search });
    }

    onTerceroChange(value: any) {
        this.selectedTercero = value;
        this.loadPedidos();
    }

    onVendedorChange(value: any) {
        this.selectedVendedor = value;
        this.loadPedidos();
    }

    @ViewChild('searchInput') searchInput!: ElementRef;

    limpiarFiltros(table?: any): void {
        if (table) {
            table.clear();
        }
        if (this.searchInput) {
            this.searchInput.nativeElement.value = '';
        }
        if (this.isAnalista) {
            this.selectedTabValue = 'En_Analisis';
            this.selectedEstado = 'En_Analisis';
        } else {
            this.selectedTabValue = 'Todos';
            this.selectedEstado = null;
        }
        this.selectedTercero = null;
        this.selectedVendedor = null;
        this.loadPedidos();
    }

    private initTabs() {
        this.estadosTabs = [
            { label: 'Borrador', value: 'Borrador', icon: 'pi pi-save' },
            { label: 'Nuevo', value: 'Nuevo', icon: 'pi pi-star' },
            { label: 'Análisis', value: 'En_Analisis', icon: 'pi pi-cog' },
            { label: 'Enviado', value: 'Enviado', icon: 'pi pi-send' },
            { label: 'Costeo', value: 'En_Costeo', icon: 'pi pi-money-bill' },
            { label: 'Cotizado', value: 'Cotizado', icon: 'pi pi-file' },
            { label: 'Aprobado', value: 'Aprobado', icon: 'pi pi-check-circle' },
            { label: 'Entregado', value: 'Entregado', icon: 'pi pi-box' },
            { label: 'Rechazado', value: 'Rechazado', icon: 'pi pi-times-circle' },
            { label: 'Cancelado', value: 'Cancelado', icon: 'pi pi-ban' }
        ];
    }

    onTabChange(value: any) {
        this.selectedTabValue = value as string;
        this.selectedEstado = value === 'Todos' ? null : value;
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
            message: `¿Está seguro de anular el pedido #${pedido.id}? Esta acción no se puede deshacer pero mantendrá el registro histórico.`,
            header: 'Confirmar Anulación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Anular',
            rejectLabel: 'Volver',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // Por ahora enviamos un motivo genérico, se podría mejorar con un prompt
                const motivo = 'Cancelado por el usuario desde el listado';
                this.store.dispatch(PedidosActions.cancelarPedido({ id: pedido.id, motivo }));
            }
        });
    }

    globalFilterFields(): string[] {
        return this.isAnalista ? ['id', 'user.name', 'maquina.tipo', 'maquina.modelo'] : ['tercero.nombre', 'id', 'maquina.modelo'];
    }

    contarItemsSolicitados(pedido: Pedido): number {
        return (pedido.total_referencias ?? 0) + (pedido.total_articulos ?? 0);
    }

    /**
     * `comentario` puede ser texto plano o JSON (array de entradas con origen/comentario/fecha).
     */
    resumenComentariosPedido(pedido: Pedido): { count: number; texto: string } {
        const raw = pedido.comentario;
        if (raw == null) {
            return { count: 0, texto: '' };
        }

        let parsed: any[] = [];
        let isJson = false;

        if (Array.isArray(raw)) {
            parsed = raw;
            isJson = true;
        } else {
            const s = String(raw).trim();
            if (s === '') return { count: 0, texto: '' };
            try {
                const p = JSON.parse(s);
                if (Array.isArray(p)) {
                    parsed = p;
                    isJson = true;
                }
            } catch {
                return { count: 1, texto: s };
            }
        }

        if (isJson) {
            const partes: string[] = [];
            for (const item of parsed) {
                if (item && typeof item === 'object' && 'comentario' in item) {
                    const texto = String(item.comentario ?? '').trim();
                    if (!texto) continue;
                    const origen = item.origen != null ? String(item.origen).trim() : '';
                    partes.push(origen ? `[${origen}] ${texto}` : texto);
                }
            }
            if (partes.length) {
                return { count: partes.length, texto: partes.join('\n\n') };
            }
            return { count: 0, texto: '' };
        }

        return { count: 1, texto: String(raw) };
    }

    /**
     * Verifica si el pedido tiene una devolución reciente del analista (tipo: 'devolucion')
     */
    tieneDevolucionReciente(pedido: Pedido): boolean {
        const raw = pedido.comentario;
        if (raw == null) return false;

        let parsed: any[] = [];
        if (Array.isArray(raw)) {
            parsed = raw;
        } else {
            try {
                const p = JSON.parse(String(raw));
                if (Array.isArray(p)) parsed = p;
            } catch {
                return false;
            }
        }

        // Buscar el último comentario con tipo 'devolucion'
        for (let i = parsed.length - 1; i >= 0; i--) {
            const item = parsed[i];
            if (item && typeof item === 'object' && item.tipo === 'devolucion') {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica si el pedido tiene una devolución reciente del asesor al analista (tipo: 'devolucion_analista')
     */
    tieneDevolucionAnalistaReciente(pedido: Pedido): boolean {
        const raw = pedido.comentario;
        if (raw == null) return false;

        let parsed: any[] = [];
        if (Array.isArray(raw)) {
            parsed = raw;
        } else {
            try {
                const p = JSON.parse(String(raw));
                if (Array.isArray(p)) parsed = p;
            } catch {
                return false;
            }
        }

        // Buscar el último comentario con tipo 'devolucion_analista'
        for (let i = parsed.length - 1; i >= 0; i--) {
            const item = parsed[i];
            if (item && typeof item === 'object' && item.tipo === 'devolucion_analista') {
                return true;
            }
        }
        return false;
    }
}
