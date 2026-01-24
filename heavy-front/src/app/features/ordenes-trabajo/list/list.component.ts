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
import { OrdenTrabajo, OrdenTrabajoEstado } from '../../../core/models/orden-trabajo.model';
import * as OrdenesTrabajoActions from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import * as OrdenesTrabajoSelectors from '../../../store/ordenes-trabajo/selectors/ordenes-trabajo.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';

/**
 * Componente de Lista de Órdenes de Trabajo
 *
 * Muestra tabla de órdenes de trabajo con filtros, búsqueda y acciones CRUD
 */
@Component({
  selector: 'app-ordenes-trabajo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="card">
      <h2>Gestión de Órdenes de Trabajo</h2>

      <!-- Filtros y Acciones -->
      <div class="mb-4">
        <div class="flex justify-content-between mb-3">
          <div class="flex gap-2 flex-wrap">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input
                pInputText
                type="text"
                (input)="onSearch($event)"
                placeholder="Buscar..." />
            </span>

            <p-select
              [options]="estadosOptions"
              [(ngModel)]="selectedEstado"
              (ngModelChange)="onEstadoChange($event)"
              placeholder="Estado"
              [showClear]="true"
              styleClass="w-48">
            </p-select>

            <p-select
              [options]="clientes"
              [(ngModel)]="selectedCliente"
              (ngModelChange)="onClienteChange($event)"
              placeholder="Cliente"
              [filter]="true"
              [showClear]="true"
              styleClass="w-48">
            </p-select>

            <p-select
              [options]="pedidos"
              [(ngModel)]="selectedPedido"
              (ngModelChange)="onPedidoChange($event)"
              placeholder="Pedido"
              [filter]="true"
              [showClear]="true"
              styleClass="w-48">
            </p-select>
          </div>

          <div class="flex gap-2">
            <p-button
              label="Limpiar Filtros"
              icon="pi pi-filter-slash"
              severity="secondary"
              [text]="true"
              (onClick)="limpiarFiltros()">
            </p-button>
            <p-button
              label="Nueva Orden"
              icon="pi pi-plus"
              (onClick)="onCreateOrdenTrabajo()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Tabla de Órdenes de Trabajo -->
      <p-table
        [value]="ordenesTrabajo()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        styleClass="p-datatable-gridlines">

        <ng-template pTemplate="header">
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Pedido</th>
            <th>Estado</th>
            <th>Transportadora</th>
            <th>Fecha Ingreso</th>
            <th>Fecha Entrega</th>
            <th>Guía</th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-orden>
          <tr>
            <td>OT-{{ orden.id }}</td>
            <td>{{ orden.tercero?.razon_social || orden.tercero?.nombre_comercial || 'N/A' }}</td>
            <td>#{{ orden.pedido_id || 'N/A' }}</td>
            <td>
              <p-tag
                [value]="orden.estado || 'N/A'"
                [severity]="getEstadoSeverity(orden.estado || 'Pendiente')">
              </p-tag>
            </td>
            <td>{{ orden.transportadora?.nombre || 'N/A' }}</td>
            <td>
              @if (orden.fecha_ingreso) {
                {{ orden.fecha_ingreso | date:'short' }}
              } @else {
                N/A
              }
            </td>
            <td>
              @if (orden.fecha_entrega) {
                {{ orden.fecha_entrega | date:'short' }}
              } @else {
                N/A
              }
            </td>
            <td>{{ orden.guia || 'N/A' }}</td>
            <td>
              <p-button
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                severity="info"
                (onClick)="onViewOrdenTrabajo(orden.id)">
              </p-button>
              <p-button
                icon="pi pi-pencil"
                [rounded]="true"
                [text]="true"
                severity="warn"
                (onClick)="onEditOrdenTrabajo(orden.id)">
              </p-button>
              <p-button
                icon="pi pi-trash"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="onDeleteOrdenTrabajo(orden)">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [],
})
export class ListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private terceroService = inject(TerceroService);
  private pedidoService = inject(PedidoService);

  // Signals para estado local
  ordenesTrabajo = signal<OrdenTrabajo[]>([]);
  loading = signal(false);
  total = signal(0);
  selectedEstado: string | null = null;
  selectedCliente: number | null = null;
  selectedPedido: number | null = null;

  // Opciones para filtros
  clientes: any[] = [];
  pedidos: any[] = [];

  estadosOptions: Array<{ label: string; value: OrdenTrabajoEstado }> = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En Proceso', value: 'En Proceso' },
    { label: 'Completado', value: 'Completado' },
    { label: 'Cancelado', value: 'Cancelado' },
  ];

  ngOnInit() {
    // Cargar datos para filtros
    this.loadFilterOptions();

    // Cargar órdenes de trabajo inicial
    this.loadOrdenesTrabajo();

    // Suscribirse al store
    this.store.select(OrdenesTrabajoSelectors.selectAllOrdenesTrabajo).subscribe((ordenesTrabajo) => {
      this.ordenesTrabajo.set(ordenesTrabajo);
    });

    this.store.select(OrdenesTrabajoSelectors.selectOrdenesTrabajoLoading).subscribe((loading) => {
      this.loading.set(loading);
    });

    this.store.select(OrdenesTrabajoSelectors.selectOrdenesTrabajoTotal).subscribe((total) => {
      this.total.set(total);
    });
  }

  /**
   * Carga las opciones para los filtros
   */
  private loadFilterOptions(): void {
    // Cargar clientes (terceros)
    this.terceroService.list({ per_page: 200 }).subscribe({
      next: (response) => {
        this.clientes = response.data.map((t) => ({
          label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
          value: t.id,
        }));
      },
    });

    // Cargar pedidos
    this.pedidoService.list({ per_page: 200 }).subscribe({
      next: (response) => {
        this.pedidos = response.data.map((p: any) => ({
          label: `Pedido #${p.id} - ${p.tercero?.razon_social || 'N/A'}`,
          value: p.id,
        }));
      },
    });
  }

  loadOrdenesTrabajo(params: any = {}) {
    // Construir parámetros de filtro
    const filterParams: any = {};

    if (this.selectedEstado) {
      filterParams.estado = this.selectedEstado;
    }
    if (this.selectedCliente) {
      filterParams.tercero_id = this.selectedCliente;
    }
    if (this.selectedPedido) {
      filterParams.pedido_id = this.selectedPedido;
    }

    // Combinar con otros parámetros (búsqueda, paginación, etc.)
    const finalParams = { ...filterParams, ...params };

    this.store.dispatch(OrdenesTrabajoActions.loadOrdenesTrabajo(finalParams));
  }

  onSearch(event: any) {
    const search = event.target.value;
    if (search.length === 0 || search.length >= 3) {
      this.loadOrdenesTrabajo({ search });
    }
  }

  onEstadoChange(estado: string | null) {
    this.selectedEstado = estado;
    this.loadOrdenesTrabajo();
  }

  onClienteChange(clienteId: number | null) {
    this.selectedCliente = clienteId;
    this.loadOrdenesTrabajo();
  }

  onPedidoChange(pedidoId: number | null) {
    this.selectedPedido = pedidoId;
    this.loadOrdenesTrabajo();
  }

  limpiarFiltros() {
    this.selectedEstado = null;
    this.selectedCliente = null;
    this.selectedPedido = null;
    this.loadOrdenesTrabajo();
  }

  onCreateOrdenTrabajo() {
    this.router.navigate(['/app/ordenes-trabajo/create']);
  }

  onViewOrdenTrabajo(id: number) {
    this.router.navigate(['/app/ordenes-trabajo', id]);
  }

  onEditOrdenTrabajo(id: number) {
    this.router.navigate(['/app/ordenes-trabajo', id, 'edit']);
  }

  onDeleteOrdenTrabajo(orden: OrdenTrabajo) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la orden de trabajo OT-${orden.id}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.store.dispatch(OrdenesTrabajoActions.deleteOrdenTrabajo({ id: orden.id }));
      },
    });
  }

  getEstadoSeverity(estado: OrdenTrabajoEstado): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'Completado':
        return 'success';
      case 'En Proceso':
        return 'info';
      case 'Pendiente':
        return 'warn';
      case 'Cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
