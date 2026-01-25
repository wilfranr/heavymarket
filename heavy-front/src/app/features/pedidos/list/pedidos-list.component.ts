import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
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
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="card">
      <p-toolbar styleClass="mb-6">
        <ng-template #start>
          <p-button label="Nuevo Pedido" icon="pi pi-plus" class="mr-2" (onClick)="onCreatePedido()" />
          <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" outlined (onClick)="limpiarFiltros()" />
        </ng-template>

        <ng-template #end>
          <div class="flex gap-2">
            <p-select [options]="estadosOptions" [(ngModel)]="selectedEstado" (ngModelChange)="onEstadoChange($event)" placeholder="Estado" [showClear]="true" styleClass="w-40" />
            <p-select [options]="terceros" [(ngModel)]="selectedTercero" (ngModelChange)="onTerceroChange($event)" placeholder="Cliente" [filter]="true" [showClear]="true" styleClass="w-48" />
            <p-select [options]="maquinas" [(ngModel)]="selectedMaquina" (ngModelChange)="onMaquinaChange($event)" placeholder="Máquina" [filter]="true" [showClear]="true" styleClass="w-48" />
            <p-select [options]="fabricantes" [(ngModel)]="selectedFabricante" (ngModelChange)="onFabricanteChange($event)" placeholder="Fabricante" [filter]="true" [showClear]="true" styleClass="w-48" />
          </div>
        </ng-template>
      </p-toolbar>

      <p-table
        [value]="pedidos()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="rowsPerPage"
        [totalRecords]="total()"
        [first]="first"
        [lazy]="true"
        (onPage)="onPageChange($event)"
        [rowHover]="true"
        [rowsPerPageOptions]="[10, 15, 25, 50]"
        responsiveLayout="scroll"
      >
        <ng-template #caption>
          <div class="flex items-center justify-between">
            <h5 class="m-0">Gestión de Pedidos</h5>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template #header>
          <tr>
            <th pSortableColumn="id" style="width: 5rem">ID <p-sortIcon field="id" /></th>
            <th pSortableColumn="tercero.razon_social">Tercero <p-sortIcon field="tercero.razon_social" /></th>
            <th pSortableColumn="estado" style="width: 10rem">Estado <p-sortIcon field="estado" /></th>
            <th>Dirección</th>
            <th pSortableColumn="created_at" style="width: 12rem">Fecha <p-sortIcon field="created_at" /></th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template #body let-pedido>
          <tr>
            <td>{{ pedido.id }}</td>
            <td>{{ pedido.tercero?.razon_social || 'N/A' }}</td>
            <td>
              <p-tag [value]="pedido.estado" [severity]="getEstadoSeverity(pedido.estado)" />
            </td>
            <td>{{ pedido.direccion || 'N/A' }}</td>
            <td>{{ pedido.created_at | date: 'short' }}</td>
            <td>
              <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onViewPedido(pedido.id)" pTooltip="Ver detalle" tooltipPosition="top" />
              <p-button icon="pi pi-pencil" severity="warn" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onEditPedido(pedido.id)" pTooltip="Editar" tooltipPosition="top" />
              <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="onDeletePedido(pedido)" pTooltip="Eliminar" tooltipPosition="top" />
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="6" class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">No se encontraron pedidos</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
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

  // Paginación
  currentPage = 1;
  rowsPerPage = 15;
  first = 0;
  selectedEstado: string | null = null;
  selectedTercero: number | null = null;
  selectedVendedor: number | null = null;
  selectedMaquina: number | null = null;
  selectedFabricante: number | null = null;
  searchTerm = '';
  private searchSubject = new Subject<string>();

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

    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchTerm = query;
      this.loadPedidos({ search: query });
    });

    // Suscribirse al store
    this.store.select(PedidosSelectors.selectAllPedidos).subscribe(pedidos => {
      this.pedidos.set(pedidos);
    });

    this.store.select(PedidosSelectors.selectPedidosLoading).subscribe(loading => {
      this.loading.set(loading);
    });

    this.store.select(PedidosSelectors.selectPedidosTotal).subscribe(total => {
      this.total.set(total);
    });

    this.store.select(PedidosSelectors.selectPedidosCurrentPage).subscribe(page => {
      this.currentPage = page;
      this.first = (page - 1) * this.rowsPerPage;
    });
  }

  /**
   * Carga las opciones para los filtros
   */
  private loadFilterOptions(): void {
    // Cargar terceros (clientes)
    this.terceroService.list({ per_page: 200, es_cliente: true }).subscribe({
      next: (response) => {
        this.terceros = response.data.map(t => ({
          label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
          value: t.id
        }));
      }
    });

    // Cargar máquinas
    this.maquinaService.getAll({ per_page: 200 }).subscribe({
      next: (response) => {
        this.maquinas = response.data.map(m => ({
          label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''}`,
          value: m.id
        }));
      }
    });

    // Cargar fabricantes
    this.fabricanteService.getAll({ per_page: 200 }).subscribe({
      next: (response) => {
        this.fabricantes = response.data.map(f => ({
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
    const finalParams = {
      ...filterParams,
      ...params,
      page: params.page || this.currentPage,
      per_page: params.per_page || this.rowsPerPage
    };

    this.store.dispatch(PedidosActions.loadPedidos({ params: finalParams }));
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.currentPage = (event.first / event.rows) + 1;
    this.rowsPerPage = event.rows;
    this.loadPedidos();
  }

  onSearch(event: any) {
    const search = event.target.value;
    this.searchSubject.next(search);
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
      'Nuevo': 'info',
      'Enviado': 'info',
      'En_Costeo': 'warn',
      'Cotizado': 'warn',
      'Aprobado': 'success',
      'Entregado': 'success',
      'Rechazado': 'danger',
      'Cancelado': 'danger'
    };
    return severityMap[estado] || 'info';
  }
}
