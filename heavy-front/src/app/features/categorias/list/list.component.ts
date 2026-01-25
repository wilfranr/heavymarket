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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Categoria } from '../../../core/models/categoria.model';
import * as CategoriasActions from '../../../store/categorias/actions/categorias.actions';
import * as CategoriasSelectors from '../../../store/categorias/selectors/categorias.selectors';

/**
 * Componente de Lista de Categorías
 */
@Component({
  selector: 'app-categorias-list',
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
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="card">
      <p-toolbar styleClass="mb-6">
        <ng-template #start>
          <p-button label="Nueva Categoría" icon="pi pi-plus" class="mr-2" (onClick)="onCreateCategoria()" />
        </ng-template>
      </p-toolbar>

      <p-table
        [value]="categorias()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="15"
        [totalRecords]="total()"
        [rowHover]="true"
        responsiveLayout="scroll"
      >
        <ng-template #caption>
          <div class="flex items-center justify-between">
            <h5 class="m-0">Gestión de Categorías</h5>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template #header>
          <tr>
            <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th>
            <th>Proveedores</th>
            <th>Referencias</th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template #body let-categoria>
          <tr>
            <td>{{ categoria.nombre }}</td>
            <td>
              @if (categoria.terceros && categoria.terceros.length > 0) {
                {{ categoria.terceros.length }} proveedor(es)
              } @else {
                Sin proveedores
              }
            </td>
            <td>
              @if (categoria.referencias && categoria.referencias.length > 0) {
                {{ categoria.referencias.length }} referencia(s)
              } @else {
                Sin referencias
              }
            </td>
            <td>
              <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onViewCategoria(categoria.id)" />
              <p-button icon="pi pi-pencil" severity="warn" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="onEditCategoria(categoria.id)" />
              <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="onDeleteCategoria(categoria)" />
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="4" class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-600">No se encontraron categorías</p>
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

  // Signals para estado local
  // Signals para estado local
  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  total = signal(0);
  searchTerm = '';
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadCategorias();

    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchTerm = query;
      this.loadCategorias({ search: query });
    });

    // Suscribirse al store
    this.store.select(CategoriasSelectors.selectAllCategorias).subscribe((categorias) => {
      this.categorias.set(categorias);
    });

    this.store.select(CategoriasSelectors.selectCategoriasLoading).subscribe((loading) => {
      this.loading.set(loading);
    });

    this.store.select(CategoriasSelectors.selectCategoriasTotal).subscribe((total) => {
      this.total.set(total);
    });
  }

  loadCategorias(params: any = {}) {
    this.store.dispatch(CategoriasActions.loadCategorias(params));
  }

  onSearch(event: any) {
    const search = event.target.value;
    this.searchSubject.next(search);
  }

  onCreateCategoria() {
    this.router.navigate(['/app/categorias/create']);
  }

  onViewCategoria(id: number) {
    this.router.navigate(['/app/categorias', id]);
  }

  onEditCategoria(id: number) {
    this.router.navigate(['/app/categorias', id, 'edit']);
  }

  onDeleteCategoria(categoria: Categoria) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.store.dispatch(CategoriasActions.deleteCategoria({ id: categoria.id }));
      },
    });
  }
}
