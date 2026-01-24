import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { loadOrdenTrabajoById } from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import * as OrdenesTrabajoSelectors from '../../../store/ordenes-trabajo/selectors/ordenes-trabajo.selectors';
import { OrdenTrabajo } from '../../../core/models/orden-trabajo.model';

/**
 * Componente de detalle de orden de trabajo
 */
@Component({
  selector: 'app-orden-trabajo-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TableModule,
  ],
  template: `
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>Orden de Trabajo OT-{{ ordenTrabajoId() }}</h2>
        <div class="flex gap-2">
          <p-button
            label="Editar"
            icon="pi pi-pencil"
            severity="warn"
            [outlined]="true"
            (onClick)="onEdit()">
          </p-button>
          <p-button
            label="Volver"
            icon="pi pi-arrow-left"
            severity="secondary"
            [outlined]="true"
            (onClick)="onBack()">
          </p-button>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="mt-4">Cargando orden de trabajo...</p>
        </div>
      } @else if (ordenTrabajo()) {
        <div class="grid">
          <!-- Información General -->
          <div class="col-12">
            <p-card header="Información General">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <p><strong>ID:</strong> OT-{{ ordenTrabajo()?.id }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Estado:</strong>
                    @if (ordenTrabajo()?.estado) {
                      <p-tag
                        [value]="ordenTrabajo()!.estado || 'N/A'"
                        [severity]="getEstadoSeverity(ordenTrabajo()!.estado || 'Pendiente')">
                      </p-tag>
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Cliente:</strong> {{ ordenTrabajo()?.tercero?.razon_social || ordenTrabajo()?.tercero?.nombre_comercial || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Pedido:</strong> #{{ ordenTrabajo()?.pedido_id || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Cotización:</strong> {{ ordenTrabajo()?.cotizacion_id ? 'COT-' + ordenTrabajo()!.cotizacion_id : 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Transportadora:</strong> {{ ordenTrabajo()?.transportadora?.nombre || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Fecha de Ingreso:</strong>
                    @if (ordenTrabajo()?.fecha_ingreso) {
                      {{ ordenTrabajo()!.fecha_ingreso | date:'short' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Fecha de Entrega:</strong>
                    @if (ordenTrabajo()?.fecha_entrega) {
                      {{ ordenTrabajo()!.fecha_entrega | date:'short' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Teléfono:</strong> {{ ordenTrabajo()?.telefono || 'N/A' }}</p>
                </div>
                @if (ordenTrabajo()?.guia) {
                  <div class="col-12 md:col-6">
                    <p><strong>Guía:</strong> {{ ordenTrabajo()!.guia }}</p>
                  </div>
                }
                @if (ordenTrabajo()?.direccion) {
                  <div class="col-12 md:col-6">
                    <p><strong>Dirección:</strong> {{ ordenTrabajo()!.direccion.direccion || 'N/A' }}</p>
                  </div>
                }
                @if (ordenTrabajo()?.observaciones) {
                  <div class="col-12">
                    <p><strong>Observaciones:</strong></p>
                    <p class="mt-2">{{ ordenTrabajo()!.observaciones }}</p>
                  </div>
                }
                @if (ordenTrabajo()?.motivo_cancelacion) {
                  <div class="col-12">
                    <p><strong>Motivo de Cancelación:</strong></p>
                    <p class="mt-2 text-red-500">{{ ordenTrabajo()!.motivo_cancelacion }}</p>
                  </div>
                }
              </div>
            </p-card>
          </div>

          <!-- Referencias -->
          @if (ordenTrabajo()?.referencias && ordenTrabajo()!.referencias!.length > 0) {
            <div class="col-12">
              <p-card header="Referencias">
                <p-table [value]="ordenTrabajo()!.referencias!" styleClass="p-datatable-sm">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>ID</th>
                      <th>Referencia</th>
                      <th>Cantidad</th>
                      <th>Cantidad Recibida</th>
                      <th>Estado</th>
                      <th>Recibido</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item>
                    <tr>
                      <td>{{ item.id }}</td>
                      <td>{{ item.referencia?.referencia || item.pedido_referencia?.referencia?.referencia || 'N/A' }}</td>
                      <td>{{ item.cantidad }}</td>
                      <td>{{ item.cantidad_recibida || 'N/A' }}</td>
                      <td>{{ item.estado || 'N/A' }}</td>
                      <td>
                        @if (item.recibido) {
                          <i class="pi pi-check text-green-500"></i>
                        } @else {
                          <i class="pi pi-times text-red-500"></i>
                        }
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-8">
          <p class="text-xl text-gray-500">Orden de trabajo no encontrada</p>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class DetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ordenTrabajo = signal<OrdenTrabajo | null>(null);
  ordenTrabajoId = signal<number>(0);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ordenTrabajoId.set(+id);
      this.loadOrdenTrabajo(+id);
    }
  }

  private loadOrdenTrabajo(id: number): void {
    this.store.dispatch(loadOrdenTrabajoById({ id }));

    this.store.select(OrdenesTrabajoSelectors.selectOrdenTrabajoById(id)).subscribe((ordenTrabajo) => {
      if (ordenTrabajo) {
        this.ordenTrabajo.set(ordenTrabajo);
        this.loading.set(false);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId(), 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/app/ordenes-trabajo']);
  }

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
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
