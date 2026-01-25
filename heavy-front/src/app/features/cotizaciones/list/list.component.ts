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
          <p-button label="Nueva Cotización" icon="pi pi-plus" class="mr-2" (onClick)="onCreateCotizacion()" />
          <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" outlined (onClick)="limpiarFiltros()" />
        </ng-template>

        <ng-template #end>
          <div class="flex gap-2">
            <p-select [options]="estadosOptions" [(ngModel)]="selectedEstado" (ngModelChange)="onEstadoChange($event)" placeholder="Estado" [showClear]="true" styleClass="w-40" />
            <p-select [options]="terceros" [(ngModel)]="selectedTercero" (ngModelChange)="onTerceroChange($event)" placeholder="Cliente" [filter]="true" [showClear]="true" styleClass="w-48" />
            <p-select [options]="pedidos" [(ngModel)]="selectedPedido" (ngModelChange)="onPedidoChange($event)" placeholder="Pedido" [filter]="true" [showClear]="true" styleClass="w-48" />
          </div>
        </ng-template>
      </p-toolbar>

      <p-table
        [value]="cotizaciones()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        [rowHover]="true"
        responsiveLayout="scroll"
      >
        <ng-template #caption>
          <div class="flex items-center justify-between">
            <h5 class="m-0">Gestión de Cotizaciones</h5>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template #header>
          <tr>
            <th pSortableColumn="id" style="width: 5rem">ID <p-sortIcon field="id" /></th>
            <th pSortableColumn="tercero.razon_social">Cliente <p-sortIcon field="tercero.razon_social" /></th>
            <th pSortableColumn="pedido_id">Pedido <p-sortIcon field="pedido_id" /></th>
            <th pSortableColumn="estado" style="width: 10rem">Estado <p-sortIcon field="estado" /></th>
            <th pSortableColumn="fecha_emision">Fecha Emisión <p-sortIcon field="fecha_emision" /></th>
            <th pSortableColumn="total">Total <p-sortIcon field="total" /></th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template #body let-cotizacion>
          <tr>
            <td>{{ cotizacion.id }}</td>
            <td>{{ cotizacion.tercero?.razon_social || cotizacion.tercero?.nombre_comercial || 'N/A' }}</td>
            <td>#{{ cotizacion.pedido_id }}</td>
            <td>
              <p-tag [value]="cotizacion.estado" [severity]="getEstadoSeverity(cotizacion.estado)" />
            </td>
            <td>{{ cotizacion.fecha_emision | date: 'short' }}</td>
            <td>{{ cotizacion.total | currency: 'COP': 'symbol': '1.0-0' }}</td>
            <td>
              <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onViewCotizacion(cotizacion.id)" pTooltip="Ver detalle" tooltipPosition="top" />
              <p-button icon="pi pi-pencil" severity="warn" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onEditCotizacion(cotizacion.id)" pTooltip="Editar" tooltipPosition="top" />
              <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="onDeleteCotizacion(cotizacion)" pTooltip="Eliminar" tooltipPosition="top" />
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="7" class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">No se encontraron cotizaciones</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
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
  // Signals para estado local
  cotizaciones = signal<Cotizacion[]>([]);
  loading = signal(false);
  total = signal(0);
  selectedEstado: string | null = null;
  selectedTercero: number | null = null;
  selectedPedido: number | null = null;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Opciones para filtros
  terceros: any[] = [];
  pedidos: any[] = [];

  estadosOptions: Array<{ label: string; value: CotizacionEstado }> = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'Enviada', value: 'Enviada' },
    { label: 'Aprobada', value: 'Aprobada' },
    { label: 'Rechazada', value: 'Rechazada' },
    { label: 'Vencida', value: 'Vencida' },
    { label: 'En Proceso', value: 'En_Proceso' },
  ];

  ngOnInit() {
    // Cargar datos para filtros
    this.loadFilterOptions();

    // Cargar cotizaciones inicial
    this.loadCotizaciones();

    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchTerm = query;
      this.loadCotizaciones({ search: query });
    });

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
    this.searchSubject.next(search);
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
      },
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
