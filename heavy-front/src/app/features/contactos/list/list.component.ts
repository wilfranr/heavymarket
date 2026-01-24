import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Contacto } from '../../../core/models/contacto.model';
import * as ContactosActions from '../../../store/contactos/actions/contactos.actions';
import * as ContactosSelectors from '../../../store/contactos/selectors/contactos.selectors';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de Lista de Contactos
 */
@Component({
  selector: 'app-contactos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmDialogModule,
    TagModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="card">
      <h2>Gestión de Contactos</h2>

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
              [(ngModel)]="selectedTercero"
              [options]="terceros"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrar por tercero"
              [showClear]="true"
              (ngModelChange)="onTerceroChange()"
              styleClass="w-full md:w-14rem">
            </p-select>
          </div>

          <div class="flex gap-2">
            <p-button
              label="Nuevo Contacto"
              icon="pi pi-plus"
              (onClick)="onCreateContacto()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Tabla de Contactos -->
      <p-table
        [value]="contactos()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        styleClass="p-datatable-gridlines">

        <ng-template pTemplate="header">
          <tr>
            <th>Nombre</th>
            <th>Tercero</th>
            <th>Cargo</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Principal</th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-contacto>
          <tr>
            <td>{{ contacto.nombre }}</td>
            <td>
              @if (contacto.tercero) {
                {{ contacto.tercero.razon_social || contacto.tercero.nombre_comercial || 'N/A' }}
              } @else {
                N/A
              }
            </td>
            <td>{{ contacto.cargo || 'N/A' }}</td>
            <td>{{ contacto.email || 'N/A' }}</td>
            <td>
              @if (contacto.indicativo && contacto.telefono) {
                +{{ contacto.indicativo }} {{ contacto.telefono }}
              } @else if (contacto.telefono) {
                {{ contacto.telefono }}
              } @else {
                N/A
              }
            </td>
            <td>
              <p-tag
                [value]="contacto.principal ? 'Sí' : 'No'"
                [severity]="contacto.principal ? 'success' : 'secondary'">
              </p-tag>
            </td>
            <td>
              <p-button
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                severity="info"
                (onClick)="onViewContacto(contacto.id)">
              </p-button>
              <p-button
                icon="pi pi-pencil"
                [rounded]="true"
                [text]="true"
                severity="warn"
                (onClick)="onEditContacto(contacto.id)">
              </p-button>
              <p-button
                icon="pi pi-trash"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="onDeleteContacto(contacto)">
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

  // Signals para estado local
  contactos = signal<Contacto[]>([]);
  loading = signal(false);
  total = signal(0);
  selectedTercero: number | null = null;
  terceros: any[] = [];

  ngOnInit() {
    // Cargar terceros para el filtro
    this.loadTerceros();

    // Cargar contactos inicial
    this.loadContactos();

    // Suscribirse al store
    this.store.select(ContactosSelectors.selectAllContactos).subscribe((contactos) => {
      this.contactos.set(contactos);
    });

    this.store.select(ContactosSelectors.selectContactosLoading).subscribe((loading) => {
      this.loading.set(loading);
    });

    this.store.select(ContactosSelectors.selectContactosTotal).subscribe((total) => {
      this.total.set(total);
    });
  }

  private loadTerceros(): void {
    this.terceroService.list({ per_page: 200 }).subscribe({
      next: (response) => {
        this.terceros = [
          { label: 'Todos', value: null },
          ...response.data.map((t) => ({
            label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
            value: t.id,
          })),
        ];
      },
    });
  }

  loadContactos(params: any = {}) {
    if (this.selectedTercero) {
      params.tercero_id = this.selectedTercero;
    }
    this.store.dispatch(ContactosActions.loadContactos(params));
  }

  onSearch(event: any) {
    const search = event.target.value;
    if (search.length === 0 || search.length >= 3) {
      this.loadContactos({ search });
    }
  }

  onTerceroChange() {
    this.loadContactos();
  }

  onCreateContacto() {
    this.router.navigate(['/app/contactos/create']);
  }

  onViewContacto(id: number) {
    this.router.navigate(['/app/contactos', id]);
  }

  onEditContacto(id: number) {
    this.router.navigate(['/app/contactos', id, 'edit']);
  }

  onDeleteContacto(contacto: Contacto) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el contacto "${contacto.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.store.dispatch(ContactosActions.deleteContacto({ id: contacto.id }));
      },
    });
  }
}
