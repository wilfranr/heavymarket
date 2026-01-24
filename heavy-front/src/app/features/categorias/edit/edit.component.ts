import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateCategoria, loadCategoriaById } from '../../../store/categorias/actions/categorias.actions';
import * as CategoriasSelectors from '../../../store/categorias/selectors/categorias.selectors';
import { UpdateCategoriaDto } from '../../../core/models/categoria.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de edición de categoría
 */
@Component({
  selector: 'app-categoria-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Editar Categoría</h2>

      @if (loading()) {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="mt-4">Cargando categoría...</p>
        </div>
      } @else if (categoriaForm) {
        <form [formGroup]="categoriaForm" (ngSubmit)="onSubmit()">
          <div class="grid">
            <div class="col-12">
              <label for="nombre" class="block mb-2">Nombre</label>
              <input
                type="text"
                formControlName="nombre"
                pInputText
                placeholder="Nombre de la categoría"
                styleClass="w-full">
            </div>

            <div class="col-12">
              <label for="terceros" class="block mb-2">Proveedores</label>
            <p-multiSelect
              formControlName="terceros"
              [options]="proveedores"
              placeholder="Seleccione proveedores"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full">
            </p-multiSelect>
            </div>
          </div>

          <div class="flex justify-content-end gap-2 mt-4">
            <p-button
              label="Cancelar"
              severity="secondary"
              icon="pi pi-times"
              type="button"
              [outlined]="true"
              (onClick)="onCancel()">
            </p-button>
            <p-button
              label="Actualizar Categoría"
              icon="pi pi-check"
              type="submit"
              [loading]="saving()"
              [disabled]="categoriaForm.invalid">
            </p-button>
          </div>
        </form>
      }
    </div>
    <p-toast></p-toast>
  `,
  styles: [],
})
export class EditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly terceroService = inject(TerceroService);

  categoriaForm!: FormGroup;
  categoriaId = signal<number>(0);
  loading = signal(true);
  saving = signal(false);
  proveedores: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoriaId.set(+id);
      this.loadCategoria(+id);
    }
    this.loadProveedores();
  }

  private loadProveedores(): void {
    this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe({
      next: (response) => {
        this.proveedores = response.data.map((t) => ({
          label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
          value: t.id,
        }));
      },
    });
  }

  private loadCategoria(id: number): void {
    this.store.dispatch(loadCategoriaById({ id }));

    this.store.select(CategoriasSelectors.selectCategoriaById(id)).subscribe((categoria) => {
      if (categoria) {
        this.initForm(categoria);
        this.loading.set(false);
      }
    });

    // También escuchar errores
    this.store.select(CategoriasSelectors.selectCategoriasError).subscribe((error) => {
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error,
        });
        this.loading.set(false);
      }
    });
  }

  private initForm(categoria: any): void {
    const tercerosIds = categoria.terceros ? categoria.terceros.map((t: any) => t.id) : [];
    
    this.categoriaForm = this.fb.group({
      nombre: [categoria.nombre || ''],
      terceros: [tercerosIds],
    });
  }

  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.markFormGroupTouched(this.categoriaForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.saving.set(true);

    const formValue = this.categoriaForm.value;
    const data: UpdateCategoriaDto = {
      nombre: formValue.nombre || undefined,
      terceros: formValue.terceros && formValue.terceros.length > 0 ? formValue.terceros : undefined,
    };

    this.store.dispatch(updateCategoria({ id: this.categoriaId(), data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.categorias)
      .subscribe((categoriasState: any) => {
        if (!categoriasState.loading && this.saving()) {
          this.saving.set(false);
          subscription.unsubscribe();

          if (categoriasState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: categoriasState.error,
            });
          } else {
            this.router.navigate(['/app/categorias', this.categoriaId()]);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/categorias', this.categoriaId()]);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
