import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card">
      <h2>Gestión de Pedidos</h2>
      
      <!-- Filtros y Acciones -->
      <div class="flex justify-content-between mb-3">
        <div class="flex gap-2">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input 
              pInputText 
              type="text" 
              (input)="onSearch($event)" 
              placeholder="Buscar..." />
          </span>
          
          <p-dropdown
            [options]="estadosOptions"
            [(ngModel)]="selectedEstado"
            (onChange)="onEstadoChange()"
            placeholder="Filtrar por estado"
            [showClear]="true">
          </p-dropdown>
        </div>
        
        <p-button 
          label="Nuevo Pedido" 
          icon="pi pi-plus"
          (onClick)="onCreatePedido()">
        </p-button>
      </div>
      
      <!-- Tabla de Pedidos -->
      <p-table 
        [value]="pedidos()" 
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        styleClass="p-datatable-gridlines">
        
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
              <p-tag 
                [value]="pedido.estado" 
                [severity]="getEstadoSeverity(pedido.estado)">
              </p-tag>
            </td>
            <td>{{ pedido.direccion || 'N/A' }}</td>
            <td>{{ pedido.created_at | date:'short' }}</td>
            <td>
              <p-button 
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                severity="info"
                (onClick)="onViewPedido(pedido.id)">
              </p-button>
              <p-button 
                icon="pi pi-pencil"
                [rounded]="true"
                [text]="true"
                severity="warning"
                (onClick)="onEditPedido(pedido.id)">
              </p-button>
              <p-button 
                icon="pi pi-trash"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="onDeletePedido(pedido)">
              </p-button>
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

  // Signals para estado local
  pedidos = signal<Pedido[]>([]);
  loading = signal(false);
  total = signal(0);
  selectedEstado: string | null = null;

  estadosOptions: Array<{label: string; value: PedidoEstado}> = [
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
    // Cargar pedidos inicial
    this.loadPedidos();

    // Suscribirse al store
    this.store.select(PedidosSelectors.selectPedidos).subscribe(pedidos => {
      this.pedidos.set(pedidos);
    });

    this.store.select(PedidosSelectors.selectPedidosLoading).subscribe(loading => {
      this.loading.set(loading);
    });

    this.store.select(PedidosSelectors.selectPedidosTotal).subscribe(total => {
      this.total.set(total);
    });
  }

  loadPedidos(params = {}) {
    this.store.dispatch(PedidosActions.loadPedidos({ params }));
  }

  onSearch(event: any) {
    const search = event.target.value;
    this.loadPedidos({ search });
  }

  onEstadoChange() {
    const estado = this.selectedEstado;
    this.loadPedidos(estado ? { estado } : {});
  }

  onCreatePedido() {
    this.router.navigate(['/pedidos/create']);
  }

  onViewPedido(id: number) {
    this.router.navigate(['/pedidos', id]);
  }

  onEditPedido(id: number) {
    this.router.navigate(['/pedidos', id, 'edit']);
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

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'Nuevo': 'info',
      'Enviado': 'info',
      'En_Costeo': 'warning',
      'Cotizado': 'warning',
      'Aprobado': 'success',
      'Entregado': 'success',
      'Rechazado': 'danger',
      'Cancelado': 'danger'
    };
    return severityMap[estado] || 'info';
  }
}
