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
import { updateOrdenTrabajo, loadOrdenTrabajoById } from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import * as OrdenesTrabajoSelectors from '../../../store/ordenes-trabajo/selectors/ordenes-trabajo.selectors';
import { UpdateOrdenTrabajoDto, OrdenTrabajoEstado } from '../../../core/models/orden-trabajo.model';

/**
 * Componente de edición de orden de trabajo
 */
@Component({
    selector: 'app-orden-trabajo-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar Orden de Trabajo OT-{{ ordenTrabajoId() }}</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando orden de trabajo...</p>
                </div>
            } @else if (ordenTrabajoForm) {
                <form [formGroup]="ordenTrabajoForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="estado" class="block mb-2">Estado</label>
                            <p-select formControlName="estado" [options]="estadosOptions" placeholder="Seleccione un estado" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="fecha_ingreso" class="block mb-2">Fecha de Ingreso</label>
                            <input type="date" formControlName="fecha_ingreso" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="fecha_entrega" class="block mb-2">Fecha de Entrega</label>
                            <input type="date" formControlName="fecha_entrega" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="telefono" class="block mb-2">Teléfono</label>
                            <input type="text" formControlName="telefono" pInputText placeholder="Teléfono de contacto" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="guia" class="block mb-2">Guía</label>
                            <input type="text" formControlName="guia" pInputText placeholder="Número de guía" styleClass="w-full" />
                        </div>

                        <div class="col-12">
                            <label for="observaciones" class="block mb-2">Observaciones</label>
                            <textarea formControlName="observaciones" pInputTextarea rows="4" placeholder="Observaciones adicionales..." styleClass="w-full"> </textarea>
                        </div>

                        @if (ordenTrabajoForm.get('estado')?.value === 'Cancelado') {
                            <div class="col-12">
                                <label for="motivo_cancelacion" class="block mb-2">Motivo de Cancelación</label>
                                <textarea formControlName="motivo_cancelacion" pInputTextarea rows="3" placeholder="Motivo de cancelación..." styleClass="w-full"> </textarea>
                            </div>
                        }
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar Orden de Trabajo" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="ordenTrabajoForm.invalid"> </p-button>
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

    ordenTrabajoForm!: FormGroup;
    ordenTrabajoId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);
    minDate = new Date();

    estadosOptions: Array<{ label: string; value: OrdenTrabajoEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Proceso', value: 'En Proceso' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenTrabajoId.set(+id);
            this.loadOrdenTrabajo(+id);
        }
    }

    private loadOrdenTrabajo(id: number): void {
        this.store.dispatch(loadOrdenTrabajoById({ id }));

        this.store.select(OrdenesTrabajoSelectors.selectOrdenTrabajoById(id)).subscribe((ordenTrabajo) => {
            if (ordenTrabajo) {
                this.initForm(ordenTrabajo);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(OrdenesTrabajoSelectors.selectOrdenesTrabajoError).subscribe((error) => {
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

    private initForm(ordenTrabajo: any): void {
        this.ordenTrabajoForm = this.fb.group({
            estado: [ordenTrabajo.estado || 'Pendiente'],
            fecha_ingreso: [ordenTrabajo.fecha_ingreso ? new Date(ordenTrabajo.fecha_ingreso).toISOString().split('T')[0] : null],
            fecha_entrega: [ordenTrabajo.fecha_entrega ? new Date(ordenTrabajo.fecha_entrega).toISOString().split('T')[0] : null],
            telefono: [ordenTrabajo.telefono || ''],
            observaciones: [ordenTrabajo.observaciones || ''],
            guia: [ordenTrabajo.guia || ''],
            motivo_cancelacion: [ordenTrabajo.motivo_cancelacion || '']
        });
    }

    onSubmit(): void {
        if (this.ordenTrabajoForm.invalid) {
            this.markFormGroupTouched(this.ordenTrabajoForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.saving.set(true);

        const formValue = this.ordenTrabajoForm.value;
        const data: UpdateOrdenTrabajoDto = {
            estado: formValue.estado,
            fecha_ingreso: formValue.fecha_ingreso ? new Date(formValue.fecha_ingreso).toISOString().split('T')[0] : undefined,
            fecha_entrega: formValue.fecha_entrega ? new Date(formValue.fecha_entrega).toISOString().split('T')[0] : undefined,
            telefono: formValue.telefono || undefined,
            observaciones: formValue.observaciones || undefined,
            guia: formValue.guia || undefined,
            motivo_cancelacion: formValue.motivo_cancelacion || undefined
        };

        this.store.dispatch(updateOrdenTrabajo({ id: this.ordenTrabajoId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.ordenesTrabajo)
            .subscribe((ordenesTrabajoState: any) => {
                if (!ordenesTrabajoState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (ordenesTrabajoState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: ordenesTrabajoState.error
                        });
                    } else {
                        this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId()]);
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
