import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { loadContactoById } from '../../../store/contactos/actions/contactos.actions';
import * as ContactosSelectors from '../../../store/contactos/selectors/contactos.selectors';
import { Contacto } from '../../../core/models/contacto.model';

/**
 * Componente de detalle de contacto
 */
@Component({
  selector: 'app-contacto-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
  ],
  template: `
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>Contacto: {{ contacto()?.nombre }}</h2>
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
          <p class="mt-4">Cargando contacto...</p>
        </div>
      } @else if (contacto()) {
        <div class="grid">
          <div class="col-12">
            <p-card header="Información General">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <p><strong>Nombre:</strong> {{ contacto()?.nombre }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>ID:</strong> {{ contacto()?.id }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Tercero:</strong>
                    @if (contacto()?.tercero) {
                      {{ contacto()!.tercero!.razon_social || contacto()!.tercero!.nombre_comercial || 'N/A' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Cargo:</strong> {{ contacto()?.cargo || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Email:</strong> {{ contacto()?.email || 'N/A' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Teléfono:</strong>
                    @if (contacto()?.indicativo && contacto()!.telefono) {
                      +{{ contacto()!.indicativo }} {{ contacto()!.telefono }}
                    } @else if (contacto()?.telefono) {
                      {{ contacto()!.telefono }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>Contacto Principal:</strong>
                    <p-tag
                      [value]="contacto()!.principal ? 'Sí' : 'No'"
                      [severity]="contacto()!.principal ? 'success' : 'secondary'">
                    </p-tag>
                  </p>
                </div>
                <div class="col-12 md:col-6">
                  <p><strong>País:</strong>
                    @if (contacto()?.country) {
                      {{ contacto()!.country!.name || 'N/A' }}
                    } @else {
                      N/A
                    }
                  </p>
                </div>
              </div>
            </p-card>
          </div>
        </div>
      } @else {
        <div class="text-center py-8">
          <p class="text-xl text-gray-500">Contacto no encontrado</p>
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

  contacto = signal<Contacto | null>(null);
  contactoId = signal<number>(0);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contactoId.set(+id);
      this.loadContacto(+id);
    }
  }

  private loadContacto(id: number): void {
    this.store.dispatch(loadContactoById({ id }));

    this.store.select(ContactosSelectors.selectContactoById(id)).subscribe((contacto) => {
      if (contacto) {
        this.contacto.set(contacto);
        this.loading.set(false);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/app/contactos', this.contactoId(), 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/app/contactos']);
  }
}
