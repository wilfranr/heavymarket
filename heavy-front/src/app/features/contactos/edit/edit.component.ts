import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateContacto, loadContactoById } from '../../../store/contactos/actions/contactos.actions';
import * as ContactosSelectors from '../../../store/contactos/selectors/contactos.selectors';
import { UpdateContactoDto } from '../../../core/models/contacto.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de edición de contacto
 */
@Component({
  selector: 'app-contacto-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Editar Contacto</h2>

      @if (loading()) {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="mt-4">Cargando contacto...</p>
        </div>
      } @else if (contactoForm) {
        <form [formGroup]="contactoForm" (ngSubmit)="onSubmit()">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="tercero_id" class="block mb-2">Tercero</label>
              <p-select
                formControlName="tercero_id"
                [options]="terceros"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un tercero"
                styleClass="w-full">
              </p-select>
            </div>

            <div class="col-12 md:col-6">
              <label for="nombre" class="block mb-2">Nombre</label>
              <input
                type="text"
                formControlName="nombre"
                pInputText
                placeholder="Nombre del contacto"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="cargo" class="block mb-2">Cargo</label>
              <input
                type="text"
                formControlName="cargo"
                pInputText
                placeholder="Cargo del contacto"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="email" class="block mb-2">Email</label>
              <input
                type="email"
                formControlName="email"
                pInputText
                placeholder="email@ejemplo.com"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-4">
              <label for="indicativo" class="block mb-2">Indicativo</label>
              <input
                type="text"
                formControlName="indicativo"
                pInputText
                placeholder="+57"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-8">
              <label for="telefono" class="block mb-2">Teléfono</label>
              <input
                type="text"
                formControlName="telefono"
                pInputText
                placeholder="Número de teléfono"
                styleClass="w-full">
            </div>

            <div class="col-12">
              <label for="principal" class="block mb-2">Contacto Principal</label>
            <p-toggleSwitch formControlName="principal"></p-toggleSwitch>
            <label class="ml-2">{{ contactoForm.get('principal')?.value ? 'Sí' : 'No' }}</label>
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
              label="Actualizar Contacto"
              icon="pi pi-check"
              type="submit"
              [loading]="saving()"
              [disabled]="contactoForm.invalid">
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

  contactoForm!: FormGroup;
  contactoId = signal<number>(0);
  loading = signal(true);
  saving = signal(false);
  terceros: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contactoId.set(+id);
      this.loadContacto(+id);
    }
    this.loadTerceros();
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

  private loadContacto(id: number): void {
    this.store.dispatch(loadContactoById({ id }));

    this.store.select(ContactosSelectors.selectContactoById(id)).subscribe((contacto) => {
      if (contacto) {
        this.initForm(contacto);
        this.loading.set(false);
      }
    });

    // También escuchar errores
    this.store.select(ContactosSelectors.selectContactosError).subscribe((error) => {
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

  private initForm(contacto: any): void {
    this.contactoForm = this.fb.group({
      tercero_id: [contacto.tercero_id || ''],
      nombre: [contacto.nombre || ''],
      cargo: [contacto.cargo || ''],
      telefono: [contacto.telefono || ''],
      indicativo: [contacto.indicativo || ''],
      email: [contacto.email || '', [Validators.email]],
      principal: [contacto.principal || false],
    });
  }

  onSubmit(): void {
    if (this.contactoForm.invalid) {
      this.markFormGroupTouched(this.contactoForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.saving.set(true);

    const formValue = this.contactoForm.value;
    const data: UpdateContactoDto = {
      tercero_id: formValue.tercero_id || undefined,
      nombre: formValue.nombre || undefined,
      cargo: formValue.cargo || null,
      telefono: formValue.telefono || null,
      indicativo: formValue.indicativo || null,
      email: formValue.email || null,
      principal: formValue.principal || false,
    };

    this.store.dispatch(updateContacto({ id: this.contactoId(), data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.contactos)
      .subscribe((contactosState: any) => {
        if (!contactosState.loading && this.saving()) {
          this.saving.set(false);
          subscription.unsubscribe();

          if (contactosState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: contactosState.error,
            });
          } else {
            this.router.navigate(['/app/contactos', this.contactoId()]);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/contactos', this.contactoId()]);
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
