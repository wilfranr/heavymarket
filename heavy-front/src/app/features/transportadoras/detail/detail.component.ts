import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { loadTransportadoraById } from '../../../store/transportadoras/actions/transportadoras.actions';
import * as TransportadorasSelectors from '../../../store/transportadoras/selectors/transportadoras.selectors';
import { Transportadora } from '../../../core/models/transportadora.model';

/**
 * Componente de detalle de transportadora
 */
@Component({
  selector: 'app-transportadora-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
  ],
  template: `
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>Transportadora: {{ transportadora()?.nombre }}</h2>
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
          <p class="mt-4">Cargando transportadora...</p>
        </div>
      } @else if (transportadora()) {
        <div class="grid">
          <div class="col-12">
            <p-card header="Información General">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <p><strong>Nombre:</strong> {{ transportadora()?.nombre }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>ID:</strong> {{ transportadora()?.id }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>NIT:</strong> {{ transportadora()?.nit || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Contacto:</strong> {{ transportadora()?.contacto || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Teléfono:</strong> {{ transportadora()?.telefono || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Celular:</strong> {{ transportadora()?.celular || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Email:</strong> {{ transportadora()?.email || 'N/A' }}</p>
                </div>
                <div class="col-12">
                  <p><strong>Dirección:</strong> {{ transportadora()?.direccion || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>País:</strong>
                    @if (transportadora()?.country) {
                      {{ transportadora()!.country!.name || 'N/A' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Ciudad:</strong>
                    @if (transportadora()?.city) {
                      {{ transportadora()!.city!.name || 'N/A' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                @if (transportadora()?.observaciones) {
                  <div class="col-12">
                    <p><strong>Observaciones:</strong></p>
                    <p>{{ transportadora()!.observaciones }}</p>
                  </div>
                }
              </div>
            </p-card>
          </div>
        </div>
      } @else {
        <div class="text-center py-8">
          <p class="text-xl text-gray-500">Transportadora no encontrada</p>
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

  transportadora = signal<Transportadora | null>(null);
  transportadoraId = signal<number>(0);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.transportadoraId.set(+id);
      this.loadTransportadora(+id);
    }
  }

  private loadTransportadora(id: number): void {
    this.store.dispatch(loadTransportadoraById({ id }));

    this.store.select(TransportadorasSelectors.selectTransportadoraById(id)).subscribe((transportadora) => {
      if (transportadora) {
        this.transportadora.set(transportadora);
        this.loading.set(false);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/app/transportadoras', this.transportadoraId(), 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/app/transportadoras']);
  }
}
