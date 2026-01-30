import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateTRM, loadTRMById } from '../../../store/trms/actions/trms.actions';
import * as TRMsSelectors from '../../../store/trms/selectors/trms.selectors';
import { UpdateTRMDto } from '../../../core/models/trm.model';

/**
 * Componente de edición de TRM
 */
@Component({
    selector: 'app-trm-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputNumberModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar TRM (Tasa Representativa del Mercado)</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando TRM...</p>
                </div>
            } @else if (trmForm) {
                <form [formGroup]="trmForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="trm" class="block mb-2">TRM (USD/COP)</label>
                            <p-inputNumber formControlName="trm" mode="decimal" [min]="0" [maxFractionDigits]="2" [minFractionDigits]="2" placeholder="Ejemplo: 4200.00" styleClass="w-full"> </p-inputNumber>
                        </div>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar TRM" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="trmForm.invalid"> </p-button>
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

    trmForm!: FormGroup;
    trmId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.trmId.set(+id);
            this.loadTRM(+id);
        }
    }

    private loadTRM(id: number): void {
        this.store.dispatch(loadTRMById({ id }));

        this.store.select(TRMsSelectors.selectTRMById(id)).subscribe((trm) => {
            if (trm) {
                this.initForm(trm);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(TRMsSelectors.selectTRMsError).subscribe((error) => {
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

    private initForm(trm: any): void {
        this.trmForm = this.fb.group({
            trm: [trm.trm || '', [Validators.required, Validators.min(0.01)]]
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

        this.saving.set(true);

        const formValue = this.trmForm.value;
        const data: UpdateTRMDto = {
            trm: formValue.trm || undefined
        };

        this.store.dispatch(updateTRM({ id: this.trmId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.trms)
            .subscribe((trmsState: any) => {
                if (!trmsState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (trmsState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: trmsState.error
                        });
                    } else {
                        this.router.navigate(['/app/trms', this.trmId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/trms', this.trmId()]);
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
