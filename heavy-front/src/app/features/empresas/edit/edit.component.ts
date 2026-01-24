import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateEmpresa, loadEmpresaById } from '../../../store/empresas/actions/empresas.actions';
import * as EmpresasSelectors from '../../../store/empresas/selectors/empresas.selectors';
import { UpdateEmpresaDto } from '../../../core/models/empresa.model';

/**
 * Componente de edición de empresa
 */
@Component({
  selector: 'app-empresa-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Editar Empresa</h2>

      @if (loading()) {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="mt-4">Cargando empresa...</p>
        </div>
      } @else if (empresaForm) {
        <form [formGroup]="empresaForm" (ngSubmit)="onSubmit()">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="nombre" class="block mb-2">Nombre</label>
              <input
                type="text"
                formControlName="nombre"
                pInputText
                placeholder="Nombre de la empresa"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="siglas" class="block mb-2">Siglas</label>
              <input
                type="text"
                formControlName="siglas"
                pInputText
                placeholder="Siglas (opcional)"
                styleClass="w-full"
                maxlength="10">
            </div>

            <div class="col-12">
              <label for="direccion" class="block mb-2">Dirección</label>
              <input
                type="text"
                formControlName="direccion"
                pInputText
                placeholder="Dirección completa"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="telefono" class="block mb-2">Teléfono</label>
              <input
                type="tel"
                formControlName="telefono"
                pInputText
                placeholder="Teléfono fijo"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="celular" class="block mb-2">Celular</label>
              <input
                type="tel"
                formControlName="celular"
                pInputText
                placeholder="Celular"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="email" class="block mb-2">Email</label>
              <input
                type="email"
                formControlName="email"
                pInputText
                placeholder="correo@empresa.com"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="nit" class="block mb-2">NIT</label>
              <input
                type="text"
                formControlName="nit"
                pInputText
                placeholder="Número de identificación tributaria"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="representante" class="block mb-2">Representante</label>
              <input
                type="text"
                formControlName="representante"
                pInputText
                placeholder="Nombre del representante legal"
                styleClass="w-full">
            </div>

            <div class="col-12 md:col-6">
              <label for="flete" class="block mb-2">Flete (por kg)</label>
              <p-inputNumber
                formControlName="flete"
                [min]="0"
                [step]="0.1"
                [showButtons]="true"
                styleClass="w-full">
              </p-inputNumber>
            </div>

            <div class="col-12 md:col-6">
              <label for="trm" class="block mb-2">TRM (Tasa de cambio)</label>
              <p-inputNumber
                formControlName="trm"
                [min]="0"
                [step]="0.01"
                [showButtons]="true"
                styleClass="w-full">
              </p-inputNumber>
            </div>

            <div class="col-12 md:col-6">
              <label for="estado" class="block mb-2">Estado</label>
              <p-select
                formControlName="estado"
                [options]="estadoOptions"
                placeholder="Seleccione un estado"
                styleClass="w-full">
              </p-select>
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
              label="Actualizar Empresa"
              icon="pi pi-check"
              type="submit"
              [loading]="saving()"
              [disabled]="empresaForm.invalid">
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

  empresaForm!: FormGroup;
  empresaId = signal<number>(0);
  loading = signal(true);
  saving = signal(false);

  estadoOptions = [
    { label: 'Activa', value: true },
    { label: 'Inactiva', value: false },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId.set(+id);
      this.loadEmpresa(+id);
    }
  }

  private loadEmpresa(id: number): void {
    this.store.dispatch(loadEmpresaById({ id }));

    this.store.select(EmpresasSelectors.selectEmpresaById(id)).subscribe((empresa) => {
      if (empresa) {
        this.initForm(empresa);
        this.loading.set(false);
      }
    });

    // También escuchar errores
    this.store.select(EmpresasSelectors.selectEmpresasError).subscribe((error) => {
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

  private initForm(empresa: any): void {
    this.empresaForm = this.fb.group({
      nombre: [empresa.nombre || ''],
      siglas: [empresa.siglas || ''],
      direccion: [empresa.direccion || ''],
      telefono: [empresa.telefono || ''],
      celular: [empresa.celular || ''],
      email: [empresa.email || ''],
      nit: [empresa.nit || ''],
      representante: [empresa.representante || ''],
      flete: [empresa.flete || 2.2],
      trm: [empresa.trm || 0],
      estado: [empresa.estado || false],
    });
  }

  onSubmit(): void {
    if (this.empresaForm.invalid) {
      this.markFormGroupTouched(this.empresaForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.saving.set(true);

    const formValue = this.empresaForm.value;
    const data: UpdateEmpresaDto = {
      nombre: formValue.nombre || undefined,
      siglas: formValue.siglas || undefined,
      direccion: formValue.direccion || undefined,
      telefono: formValue.telefono || undefined,
      celular: formValue.celular || undefined,
      email: formValue.email || undefined,
      nit: formValue.nit || undefined,
      representante: formValue.representante || undefined,
      flete: formValue.flete || undefined,
      trm: formValue.trm || undefined,
      estado: formValue.estado,
    };

    this.store.dispatch(updateEmpresa({ id: this.empresaId(), data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.empresas)
      .subscribe((empresasState: any) => {
        if (!empresasState.loading && this.saving()) {
          this.saving.set(false);
          subscription.unsubscribe();

          if (empresasState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: empresasState.error,
            });
          } else {
            this.router.navigate(['/app/empresas', this.empresaId()]);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/empresas', this.empresaId()]);
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
