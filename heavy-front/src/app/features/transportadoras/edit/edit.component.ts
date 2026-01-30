import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateTransportadora, loadTransportadoraById } from '../../../store/transportadoras/actions/transportadoras.actions';
import * as TransportadorasSelectors from '../../../store/transportadoras/selectors/transportadoras.selectors';
import { UpdateTransportadoraDto } from '../../../core/models/transportadora.model';

/**
 * Componente de edición de transportadora
 */
@Component({
    selector: 'app-transportadora-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar Transportadora</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando transportadora...</p>
                </div>
            } @else if (transportadoraForm) {
                <form [formGroup]="transportadoraForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="nombre" class="block mb-2">Nombre</label>
                            <input type="text" formControlName="nombre" pInputText placeholder="Nombre de la transportadora" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="nit" class="block mb-2">NIT</label>
                            <input type="text" formControlName="nit" pInputText placeholder="NIT de la transportadora" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="telefono" class="block mb-2">Teléfono</label>
                            <input type="text" formControlName="telefono" pInputText placeholder="Teléfono" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="celular" class="block mb-2">Celular</label>
                            <input type="text" formControlName="celular" pInputText placeholder="Celular" styleClass="w-full" />
                        </div>

                        <div class="col-12">
                            <label for="direccion" class="block mb-2">Dirección</label>
                            <textarea formControlName="direccion" pTextarea placeholder="Dirección completa" rows="2" styleClass="w-full"> </textarea>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="email" class="block mb-2">Email</label>
                            <input type="email" formControlName="email" pInputText placeholder="email@ejemplo.com" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="contacto" class="block mb-2">Contacto</label>
                            <input type="text" formControlName="contacto" pInputText placeholder="Nombre del contacto" styleClass="w-full" />
                        </div>

                        <div class="col-12">
                            <label for="observaciones" class="block mb-2">Observaciones</label>
                            <textarea formControlName="observaciones" pTextarea placeholder="Observaciones adicionales" rows="3" styleClass="w-full"> </textarea>
                        </div>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar Transportadora" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="transportadoraForm.invalid"> </p-button>
                    </div>
                </form>
            }
        </div>
        <p-toast></p-toast>
    `,
    styles: []
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    transportadoraForm!: FormGroup;
    transportadoraId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.transportadoraId.set(+id);
            this.loadTransportadora(+id);
        }
    }

    private loadTransportadora(id: number): void {
        this.store.dispatch(loadTransportadoraById({ id }));

        this.store.select(TransportadorasSelectors.selectTransportadoraById(id)).subscribe((transportadora) => {
            if (transportadora) {
                this.initForm(transportadora);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(TransportadorasSelectors.selectTransportadorasError).subscribe((error) => {
            if (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error
                });
                this.loading.set(false);
            }
        });
    }

    private initForm(transportadora: any): void {
        this.transportadoraForm = this.fb.group({
            nombre: [transportadora.nombre || ''],
            nit: [transportadora.nit || ''],
            telefono: [transportadora.telefono || ''],
            celular: [transportadora.celular || ''],
            direccion: [transportadora.direccion || ''],
            email: [transportadora.email || '', [Validators.email]],
            contacto: [transportadora.contacto || ''],
            observaciones: [transportadora.observaciones || '']
        });
    }

    onSubmit(): void {
        if (this.transportadoraForm.invalid) {
            this.markFormGroupTouched(this.transportadoraForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.saving.set(true);

        const formValue = this.transportadoraForm.value;
        const data: UpdateTransportadoraDto = {
            nombre: formValue.nombre || undefined,
            nit: formValue.nit || null,
            telefono: formValue.telefono || null,
            celular: formValue.celular || null,
            direccion: formValue.direccion || null,
            email: formValue.email || null,
            contacto: formValue.contacto || null,
            observaciones: formValue.observaciones || null
        };

        this.store.dispatch(updateTransportadora({ id: this.transportadoraId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.transportadoras)
            .subscribe((transportadorasState: any) => {
                if (!transportadorasState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (transportadorasState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: transportadorasState.error
                        });
                    } else {
                        this.router.navigate(['/app/transportadoras', this.transportadoraId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/transportadoras', this.transportadoraId()]);
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
