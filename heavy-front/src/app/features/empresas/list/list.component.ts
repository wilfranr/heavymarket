import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Empresa } from '../../../core/models/empresa.model';
import * as EmpresasActions from '../../../store/empresas/actions/empresas.actions';
import * as EmpresasSelectors from '../../../store/empresas/selectors/empresas.selectors';

/**
 * Componente de Lista de Empresas
 */
@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="card">
      <h2>Gestión de Empresas</h2>

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
          </div>

          <div class="flex gap-2">
            <p-button
              label="Nueva Empresa"
              icon="pi pi-plus"
              (onClick)="onCreateEmpresa()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Tabla de Empresas -->
      <p-table
        [value]="empresas()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        styleClass="p-datatable-gridlines">

        <ng-template pTemplate="header">
          <tr>
            <th>Nombre</th>
            <th>NIT</th>
            <th>Email</th>
            <th>Representante</th>
            <th>Estado</th>
            <th>Flete</th>
            <th>TRM</th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-empresa>
          <tr>
            <td>{{ empresa.nombre }}</td>
            <td>{{ empresa.nit }}</td>
            <td>{{ empresa.email }}</td>
            <td>{{ empresa.representante }}</td>
            <td>
              <p-tag
                [value]="empresa.estado ? 'Activa' : 'Inactiva'"
                [severity]="empresa.estado ? 'success' : 'secondary'">
              </p-tag>
            </td>
            <td>{{ empresa.flete || 'N/A' }}</td>
            <td>{{ empresa.trm || 'N/A' }}</td>
            <td>
              <p-button
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                severity="info"
                (onClick)="onViewEmpresa(empresa.id)">
              </p-button>
              <p-button
                icon="pi pi-pencil"
                [rounded]="true"
                [text]="true"
                severity="warn"
                (onClick)="onEditEmpresa(empresa.id)">
              </p-button>
              <p-button
                icon="pi pi-trash"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="onDeleteEmpresa(empresa)">
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

  // Signals para estado local
  empresas = signal<Empresa[]>([]);
  loading = signal(false);
  total = signal(0);

  ngOnInit() {
    // Cargar empresas inicial
    this.loadEmpresas();

    // Suscribirse al store
    this.store.select(EmpresasSelectors.selectAllEmpresas).subscribe((empresas) => {
      this.empresas.set(empresas);
    });

    this.store.select(EmpresasSelectors.selectEmpresasLoading).subscribe((loading) => {
      this.loading.set(loading);
    });

    this.store.select(EmpresasSelectors.selectEmpresasTotal).subscribe((total) => {
      this.total.set(total);
    });
  }

  loadEmpresas(params: any = {}) {
    this.store.dispatch(EmpresasActions.loadEmpresas(params));
  }

  onSearch(event: any) {
    const search = event.target.value;
    if (search.length === 0 || search.length >= 3) {
      this.loadEmpresas({ search });
    }
  }

  onCreateEmpresa() {
    this.router.navigate(['/app/empresas/create']);
  }

  onViewEmpresa(id: number) {
    this.router.navigate(['/app/empresas', id]);
  }

  onEditEmpresa(id: number) {
    this.router.navigate(['/app/empresas', id, 'edit']);
  }

  onDeleteEmpresa(empresa: Empresa) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la empresa ${empresa.nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.store.dispatch(EmpresasActions.deleteEmpresa({ id: empresa.id }));
      },
    });
  }
}
