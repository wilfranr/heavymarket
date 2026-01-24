import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createTransportadora } from '../../../store/transportadoras/actions/transportadoras.actions';
import { CreateTransportadoraDto } from '../../../core/models/transportadora.model';

/**
 * Componente de creación de transportadora
 */
@Component({
  selector: 'app-transportadora-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Crear Transportadora</h2>

      <form [formGroup]="transportadoraForm" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="nombre" class="block mb-2">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="nombre"
              pInputText
              placeholder="Nombre de la transportadora"
              styleClass="w-full">
            @if (transportadoraForm.get('nombre')?.invalid && transportadoraForm.get('nombre')?.touched) {
              <small class="text-red-500">El nombre es requerido</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="nit" class="block mb-2">NIT</label>
            <input
              type="text"
              formControlName="nit"
              pInputText
              placeholder="NIT de la transportadora"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="telefono" class="block mb-2">Teléfono</label>
            <input
              type="text"
              formControlName="telefono"
              pInputText
              placeholder="Teléfono"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="celular" class="block mb-2">Celular</label>
            <input
              type="text"
              formControlName="celular"
              pInputText
              placeholder="Celular"
              styleClass="w-full">
          </div>

          <div class="col-12">
            <label for="direccion" class="block mb-2">Dirección</label>
            <textarea
              formControlName="direccion"
              pTextarea
              placeholder="Dirección completa"
              rows="2"
              styleClass="w-full">
            </textarea>
          </div>

          <div class="col-12 md:col-6">
            <label for="email" class="block mb-2">Email</label>
            <input
              type="email"
              formControlName="email"
              pInputText
              placeholder="email@ejemplo.com"
              styleClass="w-full">
            @if (transportadoraForm.get('email')?.invalid && transportadoraForm.get('email')?.touched) {
              <small class="text-red-500">El email debe tener un formato válido</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="contacto" class="block mb-2">Contacto</label>
            <input
              type="text"
              formControlName="contacto"
              pInputText
              placeholder="Nombre del contacto"
              styleClass="w-full">
          </div>

          <div class="col-12">
            <label for="observaciones" class="block mb-2">Observaciones</label>
            <textarea
              formControlName="observaciones"
              pTextarea
              placeholder="Observaciones adicionales"
              rows="3"
              styleClass="w-full">
            </textarea>
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
            label="Crear Transportadora"
            icon="pi pi-check"
            type="submit"
            [loading]="loading"
            [disabled]="transportadoraForm.invalid">
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

  transportadoraForm!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.transportadoraForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      nit: [''],
      telefono: [''],
      celular: [''],
      direccion: [''],
      email: ['', [Validators.email]],
      contacto: [''],
      observaciones: [''],
    });
  }

  onSubmit(): void {
    if (this.transportadoraForm.invalid) {
      this.markFormGroupTouched(this.transportadoraForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.loading = true;

    const formValue = this.transportadoraForm.value;
    const data: CreateTransportadoraDto = {
      nombre: formValue.nombre,
      nit: formValue.nit || null,
      telefono: formValue.telefono || null,
      celular: formValue.celular || null,
      direccion: formValue.direccion || null,
      email: formValue.email || null,
      contacto: formValue.contacto || null,
      observaciones: formValue.observaciones || null,
    };

    this.store.dispatch(createTransportadora({ data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.transportadoras)
      .subscribe((transportadorasState: any) => {
        if (!transportadorasState.loading && this.loading) {
          this.loading = false;
          subscription.unsubscribe();

          if (transportadorasState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: transportadorasState.error,
            });
          } else {
            this.router.navigate(['/app/transportadoras']);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/transportadoras']);
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
