import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createEmpresa } from '../../../store/empresas/actions/empresas.actions';
import { CreateEmpresaDto } from '../../../core/models/empresa.model';

/**
 * Componente de creación de empresa
 */
@Component({
    selector: 'app-empresa-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Crear Empresa</h2>

            <form [formGroup]="empresaForm" (ngSubmit)="onSubmit()">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="nombre" class="block mb-2"> Nombre <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="nombre" pInputText placeholder="Nombre de la empresa" styleClass="w-full" />
                        @if (empresaForm.get('nombre')?.invalid && empresaForm.get('nombre')?.touched) {
                            <small class="text-red-500">El nombre es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="siglas" class="block mb-2">Siglas</label>
                        <input type="text" formControlName="siglas" pInputText placeholder="Siglas (opcional)" styleClass="w-full" maxlength="10" />
                    </div>

                    <div class="col-12">
                        <label for="direccion" class="block mb-2"> Dirección <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="direccion" pInputText placeholder="Dirección completa" styleClass="w-full" />
                        @if (empresaForm.get('direccion')?.invalid && empresaForm.get('direccion')?.touched) {
                            <small class="text-red-500">La dirección es requerida</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="telefono" class="block mb-2">Teléfono</label>
                        <input type="tel" formControlName="telefono" pInputText placeholder="Teléfono fijo" styleClass="w-full" />
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="celular" class="block mb-2"> Celular <span class="text-red-500">*</span> </label>
                        <input type="tel" formControlName="celular" pInputText placeholder="Celular" styleClass="w-full" />
                        @if (empresaForm.get('celular')?.invalid && empresaForm.get('celular')?.touched) {
                            <small class="text-red-500">El celular es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="email" class="block mb-2"> Email <span class="text-red-500">*</span> </label>
                        <input type="email" formControlName="email" pInputText placeholder="correo@empresa.com" styleClass="w-full" />
                        @if (empresaForm.get('email')?.invalid && empresaForm.get('email')?.touched) {
                            <small class="text-red-500">El email es requerido y debe ser válido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="nit" class="block mb-2"> NIT <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="nit" pInputText placeholder="Número de identificación tributaria" styleClass="w-full" />
                        @if (empresaForm.get('nit')?.invalid && empresaForm.get('nit')?.touched) {
                            <small class="text-red-500">El NIT es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="representante" class="block mb-2"> Representante <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="representante" pInputText placeholder="Nombre del representante legal" styleClass="w-full" />
                        @if (empresaForm.get('representante')?.invalid && empresaForm.get('representante')?.touched) {
                            <small class="text-red-500">El representante es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="flete" class="block mb-2">Flete (por kg)</label>
                        <p-inputNumber formControlName="flete" [min]="0" [step]="0.1" [showButtons]="true" styleClass="w-full" placeholder="2.2"> </p-inputNumber>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="trm" class="block mb-2">TRM (Tasa de cambio)</label>
                        <p-inputNumber formControlName="trm" [min]="0" [step]="0.01" [showButtons]="true" styleClass="w-full" placeholder="0"> </p-inputNumber>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="estado" class="block mb-2">Estado</label>
                        <p-select formControlName="estado" [options]="estadoOptions" placeholder="Seleccione un estado" styleClass="w-full"> </p-select>
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                    <p-button label="Crear Empresa" icon="pi pi-check" type="submit" [loading]="loading" [disabled]="empresaForm.invalid"> </p-button>
                </div>
            </form>
        </div>
        <p-toast></p-toast>
    `,
    styles: []
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    empresaForm!: FormGroup;
    loading = false;

    estadoOptions = [
        { label: 'Activa', value: true },
        { label: 'Inactiva', value: false }
    ];

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.empresaForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(300)]],
            siglas: ['', [Validators.maxLength(10)]],
            direccion: ['', [Validators.required, Validators.maxLength(255)]],
            telefono: ['', [Validators.maxLength(255)]],
            celular: ['', [Validators.required, Validators.maxLength(255)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            nit: ['', [Validators.required, Validators.maxLength(255)]],
            representante: ['', [Validators.required, Validators.maxLength(255)]],
            country_id: [null],
            state_id: [null],
            city_id: [null],
            estado: [false],
            flete: [2.2],
            trm: [0],
            logo_light: [null],
            logo_dark: [null]
        });
    }

    onSubmit(): void {
        if (this.empresaForm.invalid) {
            this.markFormGroupTouched(this.empresaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.empresaForm.value;
        const data: CreateEmpresaDto = {
            nombre: formValue.nombre,
            siglas: formValue.siglas || undefined,
            direccion: formValue.direccion,
            telefono: formValue.telefono || undefined,
            celular: formValue.celular,
            email: formValue.email,
            nit: formValue.nit,
            representante: formValue.representante,
            country_id: formValue.country_id || undefined,
            state_id: formValue.state_id || undefined,
            city_id: formValue.city_id || undefined,
            estado: formValue.estado,
            flete: formValue.flete || undefined,
            trm: formValue.trm || undefined,
            logo_light: formValue.logo_light || undefined,
            logo_dark: formValue.logo_dark || undefined
        };

        this.store.dispatch(createEmpresa({ data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.empresas)
            .subscribe((empresasState: any) => {
                if (!empresasState.loading && this.loading) {
                    this.loading = false;
                    subscription.unsubscribe();

                    if (empresasState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: empresasState.error
                        });
                    } else {
                        this.router.navigate(['/app/empresas']);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/empresas']);
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
