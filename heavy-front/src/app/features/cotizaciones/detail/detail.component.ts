import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { loadCotizacionById } from '../../../store/cotizaciones/actions/cotizaciones.actions';
import * as CotizacionesSelectors from '../../../store/cotizaciones/selectors/cotizaciones.selectors';
import { Cotizacion } from '../../../core/models/cotizacion.model';

/**
 * Componente de detalle de cotización
 */
@Component({
  selector: 'app-cotizacion-detail',
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
        <h2>Cotización #{{ cotizacionId() }}</h2>
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
          <p class="mt-4">Cargando cotización...</p>
        </div>
      } @else if (cotizacion()) {
        <div class="grid">
          <!-- Información General -->
          <div class="col-12">
            <p-card header="Información General">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <p><strong>ID:</strong> {{ cotizacion()?.id }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Estado:</strong>
                    @if (cotizacion()?.estado) {
                      <p-tag
                        [value]="cotizacion()!.estado"
                        [severity]="getEstadoSeverity(cotizacion()!.estado)">
                      </p-tag>
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Cliente:</strong> {{ cotizacion()?.tercero?.razon_social || cotizacion()?.tercero?.nombre_comercial || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Pedido:</strong> #{{ cotizacion()?.pedido_id }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Fecha de Emisión:</strong> {{ cotizacion()?.fecha_emision | date:'short' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Fecha de Vencimiento:</strong>
                    @if (cotizacion()?.fecha_vencimiento) {
                      {{ cotizacion()!.fecha_vencimiento | date:'short' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Total:</strong>
                    @if (cotizacion()?.total) {
                      {{ cotizacion()!.total | currency:'COP':'symbol':'1.0-0' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                @if (cotizacion()?.observaciones) {
                  <div class="col-12">
                    <p><strong>Observaciones:</strong></p>
                    <p class="mt-2">{{ cotizacion()?.observaciones }}</p>
                  </div>
                }
              </div>
            </p-card>
          </div>

          <!-- Referencias y Proveedores -->
          @if (cotizacion()?.referencias_proveedores && cotizacion()!.referencias_proveedores!.length > 0) {
            <div class="col-12">
              <p-card header="Referencias y Proveedores">
                <p-table [value]="cotizacion()!.referencias_proveedores!" styleClass="p-datatable-sm">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>ID</th>
                      <th>Proveedor</th>
                      <th>Referencia</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item>
                    <tr>
                      <td>{{ item.id }}</td>
                      <td>
                        {{ item.pedido_referencia_proveedor?.tercero?.razon_social || 'N/A' }}
                      </td>
                      <td>
                        {{ item.pedido_referencia_proveedor?.referencia?.referencia || 'N/A' }}
                      </td>
                      <td>
                        @if (item.pedido_referencia_proveedor?.cantidad !== undefined && item.pedido_referencia_proveedor?.cantidad !== null) {
                          {{ item.pedido_referencia_proveedor.cantidad }}
                        } @else {
                          N/A
                        }
                      </td>
                      <td>
                        @if (item.pedido_referencia_proveedor?.valor_unidad !== undefined && item.pedido_referencia_proveedor?.valor_unidad !== null) {
                          {{ item.pedido_referencia_proveedor.valor_unidad | currency:'COP':'symbol':'1.0-0' }}
                        } @else {
                          N/A
                        }
                      </td>
                      <td>
                        @if (item.pedido_referencia_proveedor?.valor_total !== undefined && item.pedido_referencia_proveedor?.valor_total !== null) {
                          {{ item.pedido_referencia_proveedor.valor_total | currency:'COP':'symbol':'1.0-0' }}
                        } @else {
                          N/A
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
          <p class="text-xl text-gray-500">Cotización no encontrada</p>
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

  cotizacion = signal<Cotizacion | null>(null);
  cotizacionId = signal<number>(0);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cotizacionId.set(+id);
      this.loadCotizacion(+id);
    }
  }

  private loadCotizacion(id: number): void {
    this.store.dispatch(loadCotizacionById({ id }));

    this.store.select(CotizacionesSelectors.selectCotizacionById(id)).subscribe((cotizacion) => {
      if (cotizacion) {
        this.cotizacion.set(cotizacion);
        this.loading.set(false);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/app/cotizaciones', this.cotizacionId(), 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/app/cotizaciones']);
  }

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
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
