import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createDireccion } from '../../../store/direcciones/actions/direcciones.actions';
import { CreateDireccionDto } from '../../../core/models/direccion.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de creación de dirección
 */
@Component({
  selector: 'app-direccion-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Crear Dirección</h2>

      <form [formGroup]="direccionForm" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="tercero_id" class="block mb-2">
              Tercero <span class="text-red-500">*</span>
            </label>
            <p-select
              formControlName="tercero_id"
              [options]="terceros"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione un tercero"
              styleClass="w-full">
            </p-select>
            @if (direccionForm.get('tercero_id')?.invalid && direccionForm.get('tercero_id')?.touched) {
              <small class="text-red-500">El tercero es requerido</small>
            }
          </div>

          <div class="col-12">
            <label for="direccion" class="block mb-2">
              Dirección <span class="text-red-500">*</span>
            </label>
            <textarea
              formControlName="direccion"
              pTextarea
              placeholder="Dirección física completa"
              rows="3"
              styleClass="w-full">
            </textarea>
            @if (direccionForm.get('direccion')?.invalid && direccionForm.get('direccion')?.touched) {
              <small class="text-red-500">La dirección es requerida</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="destinatario" class="block mb-2">Destinatario</label>
            <input
              type="text"
              formControlName="destinatario"
              pInputText
              placeholder="Nombre del destinatario"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="nit_cc" class="block mb-2">NIT/CC</label>
            <input
              type="text"
              formControlName="nit_cc"
              pInputText
              placeholder="NIT o CC del destinatario"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="ciudad_texto" class="block mb-2">Ciudad</label>
            <input
              type="text"
              formControlName="ciudad_texto"
              pInputText
              placeholder="Nombre de la ciudad"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="telefono" class="block mb-2">Teléfono</label>
            <input
              type="text"
              formControlName="telefono"
              pInputText
              placeholder="Teléfono de contacto"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="forma_pago" class="block mb-2">Forma de Pago</label>
            <input
              type="text"
              formControlName="forma_pago"
              pInputText
              placeholder="Forma de pago"
              styleClass="w-full">
          </div>

          <div class="col-12">
            <label for="principal" class="block mb-2">Dirección Principal</label>
            <p-toggleSwitch formControlName="principal"></p-toggleSwitch>
            <label class="ml-2">{{ direccionForm.get('principal')?.value ? 'Sí' : 'No' }}</label>
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
            label="Crear Dirección"
            icon="pi pi-check"
            type="submit"
            [loading]="loading"
            [disabled]="direccionForm.invalid">
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

  direccionForm!: FormGroup;
  loading = false;
  terceros: any[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadTerceros();
  }

  private initForm(): void {
    this.direccionForm = this.fb.group({
      tercero_id: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.maxLength(500)]],
      destinatario: [''],
      nit_cc: [''],
      ciudad_texto: [''],
      telefono: [''],
      forma_pago: [''],
      principal: [false],
    });
  }

  private loadTerceros(): void {
    this.terceroService.list({ per_page: 200 }).subscribe({
      next: (response) => {
        this.terceros = response.data.map((t) => ({
          label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
          value: t.id,
        }));
      },
    });
  }

  onSubmit(): void {
    if (this.direccionForm.invalid) {
      this.markFormGroupTouched(this.direccionForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.loading = true;

    const formValue = this.direccionForm.value;
    const data: CreateDireccionDto = {
      tercero_id: formValue.tercero_id,
      direccion: formValue.direccion,
      destinatario: formValue.destinatario || null,
      nit_cc: formValue.nit_cc || null,
      ciudad_texto: formValue.ciudad_texto || null,
      telefono: formValue.telefono || null,
      forma_pago: formValue.forma_pago || null,
      principal: formValue.principal || false,
    };

    this.store.dispatch(createDireccion({ data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.direcciones)
      .subscribe((direccionesState: any) => {
        if (!direccionesState.loading && this.loading) {
          this.loading = false;
          subscription.unsubscribe();

          if (direccionesState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: direccionesState.error,
            });
          } else {
            this.router.navigate(['/app/direcciones']);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/direcciones']);
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
