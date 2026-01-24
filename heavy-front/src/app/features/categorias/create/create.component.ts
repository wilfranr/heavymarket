import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createCategoria } from '../../../store/categorias/actions/categorias.actions';
import { CreateCategoriaDto } from '../../../core/models/categoria.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de creación de categoría
 */
@Component({
  selector: 'app-categoria-create',
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
      <h2>Crear Categoría</h2>

      <form [formGroup]="categoriaForm" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12">
            <label for="nombre" class="block mb-2">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="nombre"
              pInputText
              placeholder="Nombre de la categoría"
              styleClass="w-full">
            @if (categoriaForm.get('nombre')?.invalid && categoriaForm.get('nombre')?.touched) {
              <small class="text-red-500">El nombre es requerido</small>
            }
          </div>

          <div class="col-12">
            <label for="terceros" class="block mb-2">Proveedores (opcional)</label>
            <p-multiSelect
              formControlName="terceros"
              [options]="proveedores"
              placeholder="Seleccione proveedores (opcional)"
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
            label="Crear Categoría"
            icon="pi pi-check"
            type="submit"
            [loading]="loading"
            [disabled]="categoriaForm.invalid">
          </p-button>
        </div>
      </form>
    </div>
    <p-toast></p-toast>
  `,
  styles: [],
})
export class CreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly terceroService = inject(TerceroService);

  categoriaForm!: FormGroup;
  loading = false;
  proveedores: any[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadProveedores();
  }

  private initForm(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      terceros: [[]],
    });
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

    this.loading = true;

    const formValue = this.categoriaForm.value;
    const data: CreateCategoriaDto = {
      nombre: formValue.nombre,
      terceros: formValue.terceros && formValue.terceros.length > 0 ? formValue.terceros : undefined,
    };

    this.store.dispatch(createCategoria({ data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.categorias)
      .subscribe((categoriasState: any) => {
        if (!categoriasState.loading && this.loading) {
          this.loading = false;
          subscription.unsubscribe();

          if (categoriasState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: categoriasState.error,
            });
          } else {
            this.router.navigate(['/app/categorias']);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/categorias']);
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
