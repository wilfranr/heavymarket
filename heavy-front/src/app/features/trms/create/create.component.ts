import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createTRM } from '../../../store/trms/actions/trms.actions';
import { CreateTRMDto } from '../../../core/models/trm.model';

/**
 * Componente de creación de TRM
 */
@Component({
    selector: 'app-trm-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputNumberModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Crear TRM (Tasa Representativa del Mercado)</h2>

            <form [formGroup]="trmForm" (ngSubmit)="onSubmit()">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="trm" class="block mb-2"> TRM (USD/COP) <span class="text-red-500">*</span> </label>
                        <p-inputNumber formControlName="trm" mode="decimal" [min]="0" [maxFractionDigits]="2" [minFractionDigits]="2" placeholder="Ejemplo: 4200.00" styleClass="w-full"> </p-inputNumber>
                        @if (trmForm.get('trm')?.invalid && trmForm.get('trm')?.touched) {
                            <small class="text-red-500">La TRM es requerida y debe ser mayor a 0</small>
                        }
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                    <p-button label="Crear TRM" icon="pi pi-check" type="submit" [loading]="loading" [disabled]="trmForm.invalid"> </p-button>
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

    trmForm!: FormGroup;
    loading = false;

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.trmForm = this.fb.group({
            trm: ['', [Validators.required, Validators.min(0.01)]]
        });
    }

    onSubmit(): void {
        if (this.trmForm.invalid) {
            this.markFormGroupTouched(this.trmForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor ingresa un valor válido para la TRM'
            });
            return;
        }

        this.loading = true;

        const formValue = this.trmForm.value;
        const data: CreateTRMDto = {
            trm: formValue.trm
        };

        this.store.dispatch(createTRM({ data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.trms)
            .subscribe((trmsState: any) => {
                if (!trmsState.loading && this.loading) {
                    this.loading = false;
                    subscription.unsubscribe();

                    if (trmsState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: trmsState.error
                        });
                    } else {
                        this.router.navigate(['/app/trms']);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/trms']);
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
