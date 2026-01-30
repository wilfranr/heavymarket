import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateCotizacion, loadCotizacionById } from '../../../store/cotizaciones/actions/cotizaciones.actions';
import * as CotizacionesSelectors from '../../../store/cotizaciones/selectors/cotizaciones.selectors';
import { UpdateCotizacionDto, CotizacionEstado } from '../../../core/models/cotizacion.model';

/**
 * Componente de edición de cotización
 */
@Component({
    selector: 'app-cotizacion-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar Cotización #{{ cotizacionId() }}</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando cotización...</p>
                </div>
            } @else if (cotizacionForm) {
                <form [formGroup]="cotizacionForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="estado" class="block mb-2">Estado</label>
                            <p-select formControlName="estado" [options]="estadosOptions" placeholder="Seleccione un estado" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="fecha_vencimiento" class="block mb-2">Fecha de Vencimiento</label>
                            <input type="date" formControlName="fecha_vencimiento" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        </div>

                        <div class="col-12">
                            <label for="observaciones" class="block mb-2">Observaciones</label>
                            <textarea formControlName="observaciones" pInputTextarea rows="4" placeholder="Observaciones adicionales..." styleClass="w-full"> </textarea>
                        </div>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar Cotización" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="cotizacionForm.invalid"> </p-button>
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

    cotizacionForm!: FormGroup;
    cotizacionId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);
    minDate = new Date();

    estadosOptions: Array<{ label: string; value: CotizacionEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Enviada', value: 'Enviada' },
        { label: 'Aprobada', value: 'Aprobada' },
        { label: 'Rechazada', value: 'Rechazada' },
        { label: 'Vencida', value: 'Vencida' },
        { label: 'En Proceso', value: 'En_Proceso' }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cotizacionId.set(+id);
            this.loadCotizacion(+id);
        }
    }

    private loadCotizacion(id: number): void {
        this.store.dispatch(loadCotizacionById({ id }));

        this.store.select(CotizacionesSelectors.selectCotizacionById(id)).subscribe((cotizacion) => {
            if (cotizacion) {
                this.initForm(cotizacion);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(CotizacionesSelectors.selectCotizacionesError).subscribe((error) => {
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

    private initForm(cotizacion: any): void {
        this.cotizacionForm = this.fb.group({
            estado: [cotizacion.estado || 'En_Proceso'],
            fecha_vencimiento: [cotizacion.fecha_vencimiento ? new Date(cotizacion.fecha_vencimiento) : null],
            observaciones: [cotizacion.observaciones || '']
        });
    }

    onSubmit(): void {
        if (this.cotizacionForm.invalid) {
            this.markFormGroupTouched(this.cotizacionForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.saving.set(true);

        const formValue = this.cotizacionForm.value;
        const data: UpdateCotizacionDto = {
            estado: formValue.estado,
            fecha_vencimiento: formValue.fecha_vencimiento ? new Date(formValue.fecha_vencimiento).toISOString().split('T')[0] : undefined,
            observaciones: formValue.observaciones || undefined
        };

        this.store.dispatch(updateCotizacion({ id: this.cotizacionId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.cotizaciones)
            .subscribe((cotizacionesState: any) => {
                if (!cotizacionesState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (cotizacionesState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: cotizacionesState.error
                        });
                    } else {
                        this.router.navigate(['/app/cotizaciones', this.cotizacionId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/cotizaciones', this.cotizacionId()]);
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
