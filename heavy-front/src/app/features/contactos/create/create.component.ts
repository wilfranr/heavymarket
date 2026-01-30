import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createContacto } from '../../../store/contactos/actions/contactos.actions';
import { CreateContactoDto } from '../../../core/models/contacto.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de creación de contacto
 */
@Component({
    selector: 'app-contacto-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Crear Contacto</h2>

            <form [formGroup]="contactoForm" (ngSubmit)="onSubmit()">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="tercero_id" class="block mb-2"> Tercero <span class="text-red-500">*</span> </label>
                        <p-select formControlName="tercero_id" [options]="terceros" optionLabel="label" optionValue="value" placeholder="Seleccione un tercero" styleClass="w-full"> </p-select>
                        @if (contactoForm.get('tercero_id')?.invalid && contactoForm.get('tercero_id')?.touched) {
                            <small class="text-red-500">El tercero es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="nombre" class="block mb-2"> Nombre <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="nombre" pInputText placeholder="Nombre del contacto" styleClass="w-full" />
                        @if (contactoForm.get('nombre')?.invalid && contactoForm.get('nombre')?.touched) {
                            <small class="text-red-500">El nombre es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="cargo" class="block mb-2">Cargo</label>
                        <input type="text" formControlName="cargo" pInputText placeholder="Cargo del contacto" styleClass="w-full" />
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="email" class="block mb-2">Email</label>
                        <input type="email" formControlName="email" pInputText placeholder="email@ejemplo.com" styleClass="w-full" />
                        @if (contactoForm.get('email')?.invalid && contactoForm.get('email')?.touched) {
                            <small class="text-red-500">El email debe tener un formato válido</small>
                        }
                    </div>

                    <div class="col-12 md:col-4">
                        <label for="indicativo" class="block mb-2">Indicativo</label>
                        <input type="text" formControlName="indicativo" pInputText placeholder="+57" styleClass="w-full" />
                    </div>

                    <div class="col-12 md:col-8">
                        <label for="telefono" class="block mb-2">Teléfono</label>
                        <input type="text" formControlName="telefono" pInputText placeholder="Número de teléfono" styleClass="w-full" />
                    </div>

                    <div class="col-12">
                        <label for="principal" class="block mb-2">Contacto Principal</label>
                        <p-toggleSwitch formControlName="principal"></p-toggleSwitch>
                        <label class="ml-2">{{ contactoForm.get('principal')?.value ? 'Sí' : 'No' }}</label>
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                    <p-button label="Crear Contacto" icon="pi pi-check" type="submit" [loading]="loading" [disabled]="contactoForm.invalid"> </p-button>
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
    private readonly terceroService = inject(TerceroService);

    contactoForm!: FormGroup;
    loading = false;
    terceros: any[] = [];

    ngOnInit(): void {
        this.initForm();
        this.loadTerceros();
    }

    private initForm(): void {
        this.contactoForm = this.fb.group({
            tercero_id: ['', [Validators.required]],
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            cargo: [''],
            telefono: [''],
            indicativo: [''],
            email: ['', [Validators.email]],
            principal: [false]
        });
    }

    private loadTerceros(): void {
        this.terceroService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.terceros = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                }));
            }
        });
    }

    onSubmit(): void {
        if (this.contactoForm.invalid) {
            this.markFormGroupTouched(this.contactoForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.contactoForm.value;
        const data: CreateContactoDto = {
            tercero_id: formValue.tercero_id,
            nombre: formValue.nombre,
            cargo: formValue.cargo || null,
            telefono: formValue.telefono || null,
            indicativo: formValue.indicativo || null,
            email: formValue.email || null,
            principal: formValue.principal || false
        };

        this.store.dispatch(createContacto({ data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.contactos)
            .subscribe((contactosState: any) => {
                if (!contactosState.loading && this.loading) {
                    this.loading = false;
                    subscription.unsubscribe();

                    if (contactosState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: contactosState.error
                        });
                    } else {
                        this.router.navigate(['/app/contactos']);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/contactos']);
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
